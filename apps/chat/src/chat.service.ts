import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { In, Repository } from "typeorm";

import { Attachment, Chat, ChatType, Message, User } from "@app/shared/entities";
import { pagination } from "@app/shared/helpers";
import { ChatRepository, MessageRepository } from "@app/shared/repositories";

import {
	CreateGroupChatDto,
	CreateLocalChatDto,
	CreateMessageDto,
	DeleteMessagesDto,
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
		@InjectRepository(MessageRepository)
		private readonly messageRepository: MessageRepository,
		@InjectRepository(Attachment)
		private readonly attachmentRepository: Repository<Attachment>
	) {}

	logger: Logger = new Logger(ChatService.name);

	/** @returns Chat[] where `chat.type` is (Local, Group, etc.) and userId is a participant */
	async getUserChats(payload: GetUserChatsDto): Promise<PaginatedChatsDto> {
		return await this.chatRepository.getUserChats(payload);
	}

	/** @returns Chat[] where `chat.type` is local and `userId` is a participant */
	async getUserLocalChats(userId: User["id"]) {
		return await this.chatRepository.getUserLocalChats(userId);
	}

	/** @returns Chat with `participants` relation */
	async getChatForBroadcast(chatId: Chat["id"]) {
		return await this.chatRepository.findOne({
			where: { id: chatId },
			relations: {
				participants: true
			}
		});
	}

	/** Get base information about chat: id, updated_at, title, users */
	async getChat(payload: GetChatDto): Promise<Chat | null> {
		const chat = await this.chatRepository.getChat(payload);
		if (!chat) {
			this.logger.warn(
				`getChat: No chat found. Payload: ${JSON.stringify(payload)}`
			);
			return;
		}

		const isParticipant = Boolean(
			chat.participants.find(
				participant => participant.user.id === payload.currentUserId
			)
		);

		if (!isParticipant) {
			this.logger.warn(
				`getChat: User isn't a member of requested chat. Payload: ${JSON.stringify(
					payload
				)}`
			);
			return;
		}

		return chat;
	}

	/** Get messages from any chat */
	async getChatHistory(payload: GetChatHistoryDto): Promise<PaginatedMessagesDto> {
		const { chatId, page, limit } = payload;

		const chat = await this.chatRepository.findOneById(chatId);
		if (!chat) return null;

		const currentPage = pagination.getPage(page);
		const currentLimit = pagination.getLimit(limit, MAX_CHAT_HISTORY_LIMIT_PER_PAGE);

		const [messages, totalMessages] = await this.messageRepository.findAndCount({
			where: { chat: { id: chat.id } },
			skip: (currentPage - 1) * currentLimit,
			take: currentLimit,
			order: {
				created_at: "DESC"
			},
			relations: {
				reply_for: {
					user: true
				},
				user: true
			}
		});

		const totalPages = Math.ceil(totalMessages / currentLimit);

		return {
			messages,
			totalItems: totalMessages,
			totalPages,
			currentPage
		};
	}

	async createMessage(creatorId: User["id"], payload: CreateMessageDto) {
		let chat: Chat | null = null;
		let hasBeenCreated = false;

		if (payload.chatId) {
			chat = await this.chatRepository.findOneById(payload.chatId);
		}

		if (!chat && payload.userId) {
			chat = await this.createLocalChat({
				creatorId,
				participantId: payload.userId
			});
			hasBeenCreated = true;
		}

		if (!chat) {
			this.logger.warn(
				`createMessage: Chat wasn't created! Payload: ${JSON.stringify(
					payload
				)}, creatorId: ${creatorId}`
			);
			return;
		}

		const messageId = await this.messageRepository.createMessage({
			chat,
			creatorId,
			text: payload.text,
			replyForId: payload.replyForId
		});

		await this.attachmentRepository.update(
			{
				id: In(payload.attachmentIds)
			},
			{
				message: { id: messageId },
				chat: { id: chat.id }
			}
		);

		const message = await this.messageRepository.findOne({
			where: { id: messageId },
			relations: {
				reply_for: {
					user: true
				}
			}
		});

		await this.chatRepository.save({ ...chat, last_message: message });

		chat = await this.chatRepository.findOne({
			where: { id: chat.id },
			relations: {
				participants: true,
				last_message: hasBeenCreated
			}
		});

		return { message, chat, hasBeenCreated };
	}

	async deleteMessages(payload: DeleteMessagesDto): Promise<Message["id"][]> {
		const chat = await this.chatRepository.findOne({
			where: {
				id: payload.chatId,
				participants: {
					user: { id: payload.removerId }
				}
			},
			relations: {
				last_message: true,
				participants: true
			}
		});

		const removerChatRole = chat.participants[0].role;
		if (!removerChatRole) {
			this.logger.error(
				`[deleteMessages]: Chat role not found! Is something went wrong?
				Participants length: ${chat.participants.length};
				Participants[0]: ${chat.participants[0]};
				`
			);
			return [];
		}

		return await this.messageRepository.deleteMessages({
			removerId: payload.removerId,
			removerChatRole: chat.participants[0].role,
			messageIds: payload.messageIds,
			chatId: payload.chatId,
			chatType: chat.type
		});
	}

	async createGroupChat(payload: CreateGroupChatDto) {
		return await this.chatRepository.createChat({
			creatorId: payload.creatorId,
			title: payload.title,
			participantsIds: payload.participantsIds,
			type: ChatType.GROUP
		});
	}

	/** Creates local chat between `creatorId` and `participantId`.  */
	async createLocalChat(payload: CreateLocalChatDto) {
		return await this.chatRepository.createChat({
			creatorId: payload.creatorId,
			participantsIds: [payload.participantId],
			type: ChatType.LOCAL
		});
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
