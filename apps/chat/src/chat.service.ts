import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { Repository } from "typeorm";

import { RedisService } from "@app/redis";
import { Chat, ChatType, Message, User } from "@app/shared/entities";
import { pagination } from "@app/shared/helpers";
import { ChatRepository } from "@app/shared/repositories";

import {
	CreateGroupChatDto,
	CreateMessageDto,
	GetChatDto,
	GetUserChatsDto,
	PaginatedChatsDto,
	PaginatedMessagesDto
} from "./dto";
import { GetChatHistoryDto } from "./dto";

const MAX_CHAT_HISTORY_LIMIT_PER_PAGE = 70;

@Injectable()
export class ChatService {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		@InjectRepository(ChatRepository)
		private readonly chatRepository: ChatRepository,
		@InjectRepository(Message)
		private readonly messageRepository: Repository<Message>,
		private readonly cache: RedisService
	) {}

	logger: Logger = new Logger(ChatService.name);

	// * Chats
	async getUserChats(payload: GetUserChatsDto): Promise<PaginatedChatsDto> {
		return await this.chatRepository.getUserChats(payload);
	}

	async getLocalChats(userId: User["id"]) {
		return await this.chatRepository.getLocalChats(userId);
	}

	/** Get base information about chat: id, updated_at, title, users */
	async getChat(payload: GetChatDto): Promise<Chat | null> {
		const chat = await this.chatRepository.getChat(payload);

		console.log(chat);

		const isParticipant =
			chat.type === ChatType.TEMP ||
			Boolean(chat.users.find(user => user.id === payload.currentUserId));

		// If user isn't a member of requested chat - don't return this chat.
		if (!isParticipant) return null;
		return chat;
	}

	/** Get messages from any chat */
	async getChatHistory(payload: GetChatHistoryDto): Promise<PaginatedMessagesDto> {
		const chat = await this.chatRepository.findOneBy({ id: payload.chatId });
		if (!chat) return null;

		const page = pagination.getPage(payload.page);
		const limit = pagination.getLimit(
			payload.limit,
			MAX_CHAT_HISTORY_LIMIT_PER_PAGE
		);

		const [messages, totalMessages] = await this.messageRepository.findAndCount({
			where: { chat: { id: chat.id } },
			skip: (page - 1) * limit,
			take: limit,
			order: {
				id: "DESC"
			},
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
		let isCreated = false;

		if (payload.chatId && payload.chatId !== "TMP") {
			chat = await this.chatRepository.findOneById(payload.chatId);
		}

		if (!chat && payload.userId) {
			chat = await this.createLocalChat([userId, payload.userId]);
			isCreated = true;
		}

		if (!chat) {
			this.logger.debug("No chat created");
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

		// Get chat with {users} and {last_message}
		chat = await this.chatRepository.findOne({
			where: { id: chat.id },
			relations: {
				users: true,
				last_message: true
			}
		});

		return { message, chat, isCreated };
	}

	async createGroupChat(payload: CreateGroupChatDto) {
		const users = (await Promise.all(
			payload.userIds.map(userId => this.getUserById(userId))
		)) as User[];

		if (users.length < 2) {
			this.logger.debug("Number of users are to low");
			return;
		}

		const chat = await this.chatRepository.save({
			title: payload.title,
			is_group: true,
			users_count: users.length,
			users
		});

		return chat;
	}

	private async createLocalChat(userIds: User["id"][]) {
		const users = (await Promise.all(
			userIds.map(userId => this.getUserById(userId))
		)) as User[];

		if (users.length !== 2) {
			this.logger.debug("Some of the users wasn't found.");
			return;
		}

		const localChat = await this.chatRepository.getLocalChat(userIds);
		if (localChat) {
			this.logger.debug("Chat already exists.");
			return;
		}
		return await this.chatRepository.save({ users: users });
	}

	// * Microservices
	/** Get user from Auth server. */
	async getUserById(userId: User["id"]) {
		const ob$ = this.authService.send<User>(
			{ cmd: "get-user-by-id" },
			{ id: userId }
		);

		const user = await firstValueFrom(ob$).catch(e => this.logger.error(e));
		return user;
	}
}
