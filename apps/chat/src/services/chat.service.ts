import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";

import { Chat, ChatType, User } from "@app/shared/entities";
import { ChatRepository } from "@app/shared/repositories";

import {
	CreateGroupChatDto,
	CreateLocalChatDto,
	CreateMessageDto,
	DeleteMessagesDto,
	GetUserChatsDto,
	PaginatedChatsDto,
	PaginatedMessagesDto
} from "../dto";
import { GetChatHistoryDto } from "../dto";
import { canAccessChat } from "../helpers";

import { MessageService } from "./message.service";

@Injectable()
export class ChatService {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		private readonly messageService: MessageService,
		@InjectRepository(ChatRepository)
		private readonly chatRepository: ChatRepository
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

	/** @returns Message[] from existing Chat */
	async getChatHistory(
		currentUserId: User["id"],
		payload: GetChatHistoryDto
	): Promise<PaginatedMessagesDto> {
		const { chat, error } = await this.getChat({
			currentUserId,
			polymorphicId: payload.chatId
		});
		if (!chat || error === "NO_ACCESS") return;
		return await this.messageService.getMessagesPaginated(payload);
	}

	/** - Trying to get chat by `polymorphicId`.
	 * - - Validates permissions to access this chat.
	 * - Otherwise trying to get local chat between `currentUserId` and `polymorphicId`.
	 */
	async getChat({
		currentUserId,
		polymorphicId
	}: {
		currentUserId: User["id"];
		polymorphicId: Chat["id"] | User["id"];
	}): Promise<{
		chat: Chat | null;
		error: "NO_ACCESS" | null;
	}> {
		let chat = await this.chatRepository.findOne({
			where: { id: polymorphicId },
			relations: {
				participants: true
			}
		});

		if (!chat?.id) {
			// Try to find local chat.
			chat = await this.chatRepository.getLocalChat([currentUserId, polymorphicId]);
		}

		// Validate permission to access Chat if Chat was found.
		if (chat && !canAccessChat(currentUserId, chat)) {
			this.logger.warn(
				`getChat: User hasn't permissions to access requested chat.\n
					currentUserId: ${currentUserId};
					polymorphicId: ${polymorphicId};
				`
			);
			return {
				chat: null,
				error: "NO_ACCESS"
			};
		}

		return {
			chat,
			error: null
		};
	}

	async createMessage(creatorId: User["id"], payload: CreateMessageDto) {
		this.logger.debug("send message to:", payload.polymorphicId);

		const getChatResult = await this.getChat({
			currentUserId: creatorId,
			polymorphicId: payload.polymorphicId
		});

		this.logger.debug(`Got chat ${getChatResult.chat.id}`);

		let chat = getChatResult.chat;

		if (getChatResult.error) {
			this.logger.debug(`createMessage: ${getChatResult.error}.`);
			return;
		}

		let hasBeenCreated = false;
		if (!chat) {
			chat = await this.createLocalChat({
				creatorId,
				participantId: payload.polymorphicId
			});
			hasBeenCreated = true;
			this.logger.debug(`createMessage: Created local chat ${chat.id}.`);
		}

		this.logger.debug(`Creating message for ${chat.id}`);

		const message = await this.messageService.createMessage({
			creatorId,
			chatId: chat.id,
			text: payload.text,
			attachmentIds: payload.attachmentIds,
			replyForId: payload.replyForId
		});

		this.logger.debug(`created ${message.text}`);

		await this.chatRepository.updateChatLastMessage({
			chatId: chat.id,
			lastMessage: message
		});

		return { chatId: chat.id, message, hasBeenCreated };
	}

	async deleteMessages(payload: DeleteMessagesDto) {
		return await this.messageService.deleteMessages(payload);
	}

	/** Create group chat where `creatorId` has Owner role and `participantsIds` has Participant role */
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
	/** Get user from Auth service. */
	async getUserById(userId: User["id"]) {
		const user$ = this.authService.send<User>(
			{ cmd: "get-user-by-id" },
			{ id: userId }
		);
		return await firstValueFrom(user$).catch(e => this.logger.error(e));
	}
}
