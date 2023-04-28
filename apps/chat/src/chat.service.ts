import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { Repository } from "typeorm";

import { Chat, Message, User } from "@app/shared/entities";

import { CreateMessageDto } from "./dto";

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(Chat)
		private readonly chatRepository: Repository<Chat>,
		@InjectRepository(Message)
		private readonly messageRepository: Repository<Message>,
		@Inject("AUTH_SERVICE") private readonly authService: ClientProxy,
		@Inject("PRESENCE_SERVICE") private readonly presenceService: ClientProxy
	) {}

	logger: Logger = new Logger(ChatService.name);

	/** Creates conversation between two users. */
	async createConversation(userId: User["id"], friendId: User["id"]) {
		const user = await this.getUserById(userId);
		const friend = await this.getUserById(friendId);

		if (!user || !friend) return null;

		const conversation = await this.findConversation(userId, friendId);

		if (!conversation) {
			return await this.chatRepository.save({
				users: [user, friend]
			});
		}
	}

	async createMessage(userId: User["id"], payload: CreateMessageDto) {
		const chat = await this.findChatById(payload.chatId);
		if (!chat) return null;

		return await this.messageRepository.save({
			user: { id: userId },
			text: payload.text,
			chat
		});
	}

	async getChats(userId: User["id"]) {
		return await this.findChats(userId);
	}

	// * Helpers
	/** Find conversation between two users. */
	private async findConversation(userId: User["id"], friendId: User["id"]) {
		return await this.chatRepository
			.createQueryBuilder("conversation")
			.leftJoin("conversation.users", "user")
			.where("user.id IN (:userId, :friendId)", { userId, friendId })
			.groupBy("conversation.id")
			.having("COUNT(*) = 2")
			.getOne();
	}

	/** Find chats where user consists of. */
	private async findChats(userId: User["id"]) {
		return await this.chatRepository
			.createQueryBuilder("chats")
			.leftJoin("chats.users", "user")
			.where("user.id = :userId", { userId })
			.groupBy("conversation.id")
			.having("COUNT(*) > 2")
			.getMany();
	}

	private async findChatById(chatId: Chat["id"]) {
		return await this.chatRepository.findOne({
			where: { id: chatId }
		});
	}

	/** Get user from Auth server. */
	private async getUserById(userId: User["id"]) {
		const ob$ = this.authService.send<User>(
			{ cmd: "get-user-by-id" },
			{ id: userId }
		);

		const user = await firstValueFrom(ob$).catch(e => this.logger.error(e));
		return user;
	}
}
