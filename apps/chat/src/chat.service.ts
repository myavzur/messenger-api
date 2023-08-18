import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { Repository } from "typeorm";

import { RedisService } from "@app/redis";
import { Chat, Message, User } from "@app/shared/entities";
import { pagination } from "@app/shared/helpers";

import {
	CreateMessageDto,
	GetChatDto,
	GetChatsDto,
	PaginatedChatsDto,
	PaginatedMessagesDto
} from "./dto";
import { GetChatHistoryDto } from "./dto/get-chat-history.dto";
import { ConnectedUser } from "./interfaces";
import { ChatRepository } from "@app/shared/repositories";

const MAX_CHAT_HISTORY_LIMIT_PER_PAGE = 70;

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(ChatRepository)
		private readonly chatRepository: ChatRepository,
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
	async getChats(payload: GetChatsDto): Promise<PaginatedChatsDto> {
		return await this.chatRepository.findChats(payload);
	}

	/** Get base information about chat: id, updated_at, title, users */
	async getChat(payload: GetChatDto): Promise<Chat> {
		const chat = await this.chatRepository.findOne({
			where: {
				id: payload.chatId
			},
			relations: { users: true }
		});

		const isParticipant = Boolean(
			chat.users.find(user => user.id === payload.userId)
		);

		// If user isn't a member of requested chat - don't return this chat.
		if (!isParticipant) return null;

		return chat;
	}

	/** Get messages from chat */
	async getChatHistory(payload: GetChatHistoryDto): Promise<PaginatedMessagesDto> {
		const chat = await this.chatRepository.findOneBy({ id: payload.chatId });
		if (!chat) return null;

		const page = pagination.getPage(payload.page);
		const limit = pagination.getLimit(payload.limit, MAX_CHAT_HISTORY_LIMIT_PER_PAGE);

		const [messages, totalMessages] = await this.messageRepository.findAndCount({
			where: { chat: { id: chat.id } },
			order: { created_at: "DESC" },
			skip: (page - 1) * limit,
			take: limit,
			relations: {
				user: true
			}
		});

		const totalPages = Math.ceil(totalMessages / limit);

		return {
			messages,
			totalItems: totalMessages,
			totalPages,
			currentPage: page
		};
	}

	async createMessage(userId: User["id"], payload: CreateMessageDto) {
		let chat: Chat | null = null;

		// Find chat if chatId was passed.
		if (payload.chatId) {
			chat = await this.chatRepository.findOneById(payload.chatId);
		} else if (payload.userId) {
			chat = await this.createConversation(userId, payload.userId);
		} else {
			this.logger.log(`No chat was created or found.`);
			return null;
		}

		// * Message
		let message = await this.messageRepository.save({
			user: { id: userId },
			text: payload.text,
			chat
		});

		// Get message with creator
		message = await this.messageRepository.findOne({
			where: { id: message.id },
			relations: { user: true }
		});

		// * Chat
		chat = await this.chatRepository.save({
			...chat,
			last_message: message
		});

		// Get chat with participants
		chat = await this.chatRepository.findOne({
			where: { id: chat.id },
			relations: { users: true }
		});

		return { message, chat };
	}

	/** Creates conversation between two users. */
	private async createConversation(userId: User["id"], withUserId: User["id"]) {
		this.logger.log(
			`Creating conversation between two users user:${userId} and user:${withUserId}`
		);
		const user = await this.getUserById(userId);
		const withUser = await this.getUserById(withUserId);

		if (!user || !withUser) return null;

		const conversation = await this.chatRepository.findConversation(userId, withUserId);

		if (!conversation) {
			return await this.chatRepository.save({
				users: [user, withUser]
			});
		}

		this.logger.log(
			`Conversation between user:${user.account_name} and friend:${withUser.account_name} already exists.`
		);
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
