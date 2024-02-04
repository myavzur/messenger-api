import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cache } from "cache-manager";

import { User } from "@app/shared/entities";

import { ConnectedChatUser, ConnectedPresenceUser } from "./interfaces";

const CHAT_PREFIX = "chat-user:";
const PRESENCE_PREFIX = "user:";

@Injectable()
export class RedisService {
	constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

	logger: Logger = new Logger(RedisService.name);

	// * Chat POOL
	async setChatUser(chatParticipant: ConnectedChatUser) {
		const key = CHAT_PREFIX + chatParticipant.userId;
		await this.set(key, chatParticipant, 0);
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
	async setPresenceUser(presenceUser: ConnectedPresenceUser) {
		const key = PRESENCE_PREFIX + presenceUser.userId;
		await this.set(key, presenceUser, 0);
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

	// * Private
	private async get(key: string) {
		this.logger.debug(`GET ${key}`);
		return await this.cache.get(key);
	}

	private async set(key: string, value: unknown, ttl = 0) {
		this.logger.debug(`SET ${key}`);
		await this.cache.set(key, value, ttl);
	}

	private async delete(key: string) {
		this.logger.debug(`DELETE ${key}`);
		await this.cache.del(key);
	}

	private async reset() {
		await this.cache.reset();
	}
}
