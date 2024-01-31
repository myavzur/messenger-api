import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";

import { Chat, User } from "../entities";
import { ChatUser } from "../entities/chat-user.entity";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	IChatUserRepository,
	IUpdateUserRoleParams,
	IUpdateUsersParams
} from "./chat-user.repository.interface";

@Injectable()
export class ChatUserRepository
	extends BaseRepositoryAbstract<ChatUser>
	implements IChatUserRepository
{
	constructor(private dataSource: DataSource) {
		super(ChatUser, dataSource.createEntityManager());
	}

	logger: Logger = new Logger(ChatUserRepository.name);
	async getUserChats(userId: User["id"]): Promise<ChatUser[]> {
		const chatIdsQb = await this.dataSource
			.getRepository(Chat)
			.createQueryBuilder("chat")
			.select("chat.id")
			.innerJoin("chat.users", "user")
			.where("user.id = :userId", { userId });

		return await this.createQueryBuilder("chat_users")
			.leftJoinAndSelect("chat_users.chat", "chat")
			.leftJoinAndSelect("chat.users", "users")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.where(`chat.id IN (${chatIdsQb.getQuery()})`)
			.setParameters(chatIdsQb.getParameters())
			.getMany();
	}

	async saveUsers({ chatId, userIds }: IUpdateUsersParams): Promise<void> {
		await Promise.all(
			userIds.map(userId =>
				this.save({
					chat: { id: chatId },
					user: { id: userId }
				})
			)
		);

		return;
	}

	async deleteUsers({ chatId, userIds }: IUpdateUsersParams): Promise<void> {
		await Promise.all(
			userIds.map(userId =>
				this.delete({
					chat: { id: chatId },
					user: { id: userId }
				})
			)
		);

		return;
	}

	async updateUserRole({
		chatId,
		userId,
		role
	}: IUpdateUserRoleParams): Promise<void> {
		await this.save({
			chat: { id: chatId },
			user: { id: userId },
			role
		});

		return;
	}
}
