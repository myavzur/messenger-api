import { Injectable } from "@nestjs/common";

import { RedisService } from "@app/redis";
import { User } from "@app/shared/entities";

import { ConnectedUser } from "./interfaces";

@Injectable()
export class PresenceService {
	constructor(private readonly cache: RedisService) {}

	async getConnectedUserById(
		userId: User["id"]
	): Promise<ConnectedUser | undefined> {
		return (await this.cache.get(`user ${userId}`)) as ConnectedUser | undefined;
	}
}
