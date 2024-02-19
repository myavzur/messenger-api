import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cache } from "cache-manager";

import { Attachment, User } from "@app/shared/entities";

import { ConnectedChatUser, ConnectedPresenceUser } from "./interfaces";
import {
	ConfirmUnusedFilesParams,
	GetUnusedFilesParams,
	KeepUnusedFilesParams,
	UnusedFile
} from "./interfaces/unused-files";

const UNUSED_FILES_TTL = 0; // 30 minutes
const UNUSED_FILES_PREFIX = "files-unused-user:";
const CHAT_PREFIX = "chat-user:";
const PRESENCE_PREFIX = "user:";

@Injectable()
export class RedisService {
	constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

	logger: Logger = new Logger(RedisService.name);

	// * Chat POOL
	async setChatUser(user: ConnectedChatUser) {
		const key = CHAT_PREFIX + user.userId;
		await this.set(key, user, 0);
	}

	async getChatUser(userId: User["id"]): Promise<ConnectedChatUser | undefined> {
		const key = CHAT_PREFIX + userId;
		return (await this.get(key)) as ConnectedChatUser | undefined;
	}

	async deleteChatUser(userId: User["id"]) {
		const key = CHAT_PREFIX + userId;
		await this.delete(key);
	}

	// * Presence POOL
	async setPresenceUser(user: ConnectedPresenceUser) {
		const key = PRESENCE_PREFIX + user.userId;
		await this.set(key, user, 0);
	}

	async getPresenceUser(
		userId: User["id"]
	): Promise<ConnectedPresenceUser | undefined> {
		const key = PRESENCE_PREFIX + userId;
		return (await this.get(key)) as ConnectedPresenceUser | undefined;
	}

	async deletePresenceUser(userId: User["id"]) {
		const key = PRESENCE_PREFIX + userId;
		await this.delete(key);
	}

	// * Uploads POOL
	/** Записывает файлы созданные пользователем, которые нигде не отображаются
	 * - Кейс-1: Пользователь загружает файлы к сообщению, но самого сообщения ещё нет. А сохранить
	 * информацию об загруженных файлах нужно! Чтобы не вышло так, что файлы загружены, но сообщения для них нет. */
	async getUnusedFiles(
		params: GetUnusedFilesParams
	): Promise<UnusedFile[] | undefined> {
		const key = UNUSED_FILES_PREFIX + params.userId;
		return (await this.get(key)) as UnusedFile[] | undefined;
	}

	async keepUnusedFiles(params: KeepUnusedFilesParams) {
		const key = UNUSED_FILES_PREFIX + params.userId;

		const unusedFiles = await this.getUnusedFiles({ userId: params.userId });
		if (!unusedFiles) {
			await this.set(key, params.unusedFiles, UNUSED_FILES_TTL);
			this.logger.debug(`keepUnusedFiles: Set tracking key ${key}`);
			return;
		}

		const newUnusedFiles = [...unusedFiles, ...params.unusedFiles];
		await this.set(key, newUnusedFiles, UNUSED_FILES_TTL);
		this.logger.debug(`keepUnusedFiles: Has updated existing tracking key ${key}`);
	}

	async confirmUnusedFiles(params: ConfirmUnusedFilesParams): Promise<void> {
		const key = UNUSED_FILES_PREFIX + params.userId;

		const unusedFiles = await this.getUnusedFiles({ userId: params.userId });
		const filteredUnusedFiles = unusedFiles.filter(unusedFile => {
			return !params.unusedFileIds.includes(unusedFile.id);
		});

		if (filteredUnusedFiles.length === 0) {
			await this.delete(key);
			this.logger.debug(`confirmUnusedFiles: Has deleted tracking key ${key}.`);
			return;
		}

		await this.set(key, filteredUnusedFiles, UNUSED_FILES_TTL);
	}

	private async get(key: string) {
		this.logger.log(`GET ${key}`);
		return await this.cache.get(key);
	}

	private async set(key: string, value: unknown, ttl = 0) {
		this.logger.log(`SET ${key}`);
		await this.cache.set(key, value, ttl);
	}

	private async delete(key: string) {
		this.logger.log(`DELETE ${key}`);
		await this.cache.del(key);
	}

	private async reset() {
		await this.cache.reset();
	}
}
