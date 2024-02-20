import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";

import { User } from "@app/shared/entities";

import { ConnectedChatUser, ConnectedPresenceUser, UnusedFile } from "./interfaces";
import {
	AddUnusedFilesPayload,
	DeleteUnusedFilesPayload,
	GetChatUserResult,
	GetPresenceUserResult,
	GetUnusedFilesPayload,
	GetUnusedFilesResult,
	IRedisService
} from "./redis.service.interface";

const UNUSED_FILES_TTL = 0; // 30 minutes
const UNUSED_FILES_PREFIX = "files-unused-user:";
const CHAT_PREFIX = "chat-user:";
const PRESENCE_PREFIX = "user:";

@Injectable()
export class RedisService implements IRedisService {
	constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

	logger: Logger = new Logger(RedisService.name);

	// * Chat POOL
	async setChatUser(payload: ConnectedChatUser): Promise<void> {
		const key = CHAT_PREFIX + payload.userId;
		await this.set(key, payload, 0);
	}

	async getChatUser(payload: User["id"]): Promise<GetChatUserResult> {
		const key = CHAT_PREFIX + payload;
		return (await this.get(key)) as GetChatUserResult;
	}

	async deleteChatUser(payload: User["id"]): Promise<void> {
		const key = CHAT_PREFIX + payload;
		await this.delete(key);
	}

	// * Presence POOL
	async setPresenceUser(payload: ConnectedPresenceUser): Promise<void> {
		const key = PRESENCE_PREFIX + payload.userId;
		await this.set(key, payload, 0);
	}

	async getPresenceUser(payload: User["id"]): Promise<GetPresenceUserResult> {
		const key = PRESENCE_PREFIX + payload;
		return (await this.get(key)) as GetPresenceUserResult;
	}

	async deletePresenceUser(payload: User["id"]) {
		const key = PRESENCE_PREFIX + payload;
		await this.delete(key);
	}

	// * Uploads POOL
	async getUnusedFiles(
		payload: GetUnusedFilesPayload
	): Promise<GetUnusedFilesResult> {
		const key = UNUSED_FILES_PREFIX + payload.userId;
		return (await this.get(key)) as GetUnusedFilesResult;
	}

	async addUnusedFiles(payload: AddUnusedFilesPayload): Promise<void> {
		const key = UNUSED_FILES_PREFIX + payload.userId;

		const unusedFiles = await this.getUnusedFiles({ userId: payload.userId });
		if (!unusedFiles) {
			await this.set(key, payload.files, UNUSED_FILES_TTL);
			this.logger.debug(`keepUnusedFiles: Set tracking key ${key}`);
			return;
		}

		const newUnusedFiles = [...unusedFiles, ...payload.files];
		await this.set(key, newUnusedFiles, UNUSED_FILES_TTL);
		this.logger.debug(`keepUnusedFiles: Has updated existing tracking key ${key}`);
	}

	async deleteUnusedFiles(payload: DeleteUnusedFilesPayload): Promise<void> {
		const key = UNUSED_FILES_PREFIX + payload.userId;

		const unusedFiles = await this.getUnusedFiles({ userId: payload.userId });
		const filteredUnusedFiles = unusedFiles.filter(unusedFile => {
			return !payload.fileIds.includes(unusedFile.id);
		});

		if (filteredUnusedFiles.length === 0) {
			await this.delete(key);
			this.logger.debug(`deleteUnusedFiles: Has deleted tracking key ${key}.`);
			return;
		}

		await this.set(key, filteredUnusedFiles, UNUSED_FILES_TTL);
	}

	private async get(key: string): Promise<unknown> {
		this.logger.log(`GET ${key}`);
		return await this.cache.get(key);
	}

	private async set(key: string, value: unknown, ttl = 0): Promise<void> {
		this.logger.log(`SET ${key}`);
		await this.cache.set(key, value, ttl);
	}

	private async delete(key: string): Promise<void> {
		this.logger.log(`DELETE ${key}`);
		await this.cache.del(key);
	}
}
