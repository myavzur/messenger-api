import { Injectable } from "@nestjs/common";

import { RedisService } from "@app/redis";
import { User } from "@app/shared/entities";

import { ConnectedUser } from "./interfaces";

@Injectable()
export class PresenceService {
	constructor(private readonly cache: RedisService) {}

	async setConnectedUser(connectedUser: ConnectedUser) {
		await this.cache.set(`user:${connectedUser.userId}`, connectedUser, 0);
	}

	async getConnectedUserById(
		userId: User["id"]
	): Promise<ConnectedUser | undefined> {
		return (await this.cache.get(`user:${userId}`)) as ConnectedUser | undefined;
	}

	async deleteConnectedUserById(userId: User["id"]) {
		await this.cache.delete(`user:${userId}`);
	}
}
