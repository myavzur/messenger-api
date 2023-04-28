import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { Repository } from "typeorm";

import { RedisService } from "@app/redis";
import { Chat, Message, User } from "@app/shared/entities";

import { CreateMessageDto } from "./dto";
import { ConnectedUser } from "./interfaces";

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(Chat)
		private readonly chatRepository: Repository<Chat>,
		@InjectRepository(Message)
		private readonly messageRepository: Repository<Message>,
		private readonly cache: RedisService,
		@Inject("AUTH_SERVICE") private readonly authService: ClientProxy,
		@Inject("PRESENCE_SERVICE") private readonly presenceService: ClientProxy
	) {}

	logger: Logger = new Logger(ChatService.name);

	// * Cache
	async setConnectedUser(connectedUser: ConnectedUser) {
		await this.cache.set(`chat-user:${connectedUser.userId}`, connectedUser, 0);
	}

	async getConnectedUserById(
		userId: User["id"]
	): Promise<ConnectedUser | undefined> {
		return (await this.cache.get(`chat-user:${userId}`)) as
			| ConnectedUser
			| undefined;
	}

	async deleteConnectedUserById(userId: User["id"]) {
		await this.cache.delete(`chat-user:${userId}`);
	}

	// * Chats
	async createMessage(userId: User["id"], payload: CreateMessageDto) {
		let chat;

		// Find chat if chatId was passed.
		if (payload.chatId) {
			chat = await this.findChatById(payload.chatId);
		}

		// Create conversation if chat not exists and friendId was passed.
		if (!chat && payload.friendId) {
			chat = await this.createConversation(userId, payload.friendId);
		}

		// No chat was created or found.
		if (!chat) {
			this.logger.log(`No chat was created or found.`);
			return null;
		}

		const message = await this.messageRepository.save({
			user: { id: userId },
			text: payload.text,
			chat
		});

		this.logger.log(
			`Everything have gone well. Message for chat:${chat.id} was created.`
		);

		// TODO: Вынести в отдельную функцию updateChat
		const updatedChat = await this.chatRepository.save({
			...chat,
			last_message: message
		});

		this.logger.log(`Chat updated.`);
		console.log(updatedChat);

		return message;
	}

	async getChats(userId: User["id"]) {
		return await this.findChats(userId);
	}

	/** Creates conversation between two users. */
	private async createConversation(userId: User["id"], friendId: User["id"]) {
		this.logger.log(
			`Creating conversation between two users user:${userId} and user:${friendId}`
		);
		const user = await this.getUserById(userId);
		const friend = await this.getUserById(friendId);

		if (!user || !friend) return null;

		const conversation = await this.findConversation(userId, friendId);

		if (!conversation) {
			return await this.chatRepository.save({
				users: [user, friend]
			});
		}

		this.logger.log(
			`Conversation between user:${user.account_name} and friend:${friend.account_name} already exists.`
		);
	}

	// * Repository
	/** Find conversation between two users. */
	private async findConversation(userId: User["id"], friendId: User["id"]) {
		return await this.chatRepository
			.createQueryBuilder("chat")
			.leftJoin("chat.users", "user")
			.where("user.id IN (:userId, :friendId)", { userId, friendId })
			.groupBy("chat.id")
			.having("COUNT(*) = 2")
			.getOne();
	}

	/** Find chats where user consists of.
	 * - Returns chat.users without object of userId.
	 */
	private async findChats(userId: User["id"]) {
		// Get chats where {userId} is a member.
		const subquery = await this.chatRepository
			.createQueryBuilder("subquery")
			.select("subquery.id")
			.innerJoin("subquery.users", "user")
			.where("user.id = :userId", { userId })
			.getQuery();

		// Get chats with filtered chat.users (without {userId}).
		return await this.chatRepository
			.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.users", "user")
			.leftJoinAndSelect("chat.messages", "message")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.leftJoinAndSelect("message.user", "message_user")
			.where(`chat.id IN (${subquery})`)
			.andWhere("user.id != :userId", { userId })
			.orderBy("chat.updated_at", "DESC")
			.getMany();
	}

	private async findChatById(chatId: Chat["id"]) {
		return await this.chatRepository.findOne({
			where: { id: chatId }
		});
	}

	// * Microservices
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
