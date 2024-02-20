import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";

import {
	Chat,
	ChatParticipant,
	ChatParticipantRole,
	ChatType,
	User
} from "@app/shared/entities";
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
import { TemporaryChat } from "../interfaces";

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

		this.logger.log(`[getChat]: ${chat ? "Found" : "Couldn't find"} chat by ID.`);

		if (!chat?.id) {
			// Try to find local chat.
			chat = await this.chatRepository.getLocalChatBetweenTwoUsers([
				currentUserId,
				polymorphicId
			]);
			this.logger.log(
				`[getChat]: ${chat ? "Found" : "Couldn't find"} chat between two users.`
			);
		}

		// Validate permission to access Chat if Chat was found.
		if (chat?.id && !canAccessChat(currentUserId, chat)) {
			this.logger.log(`[getChat]: No access to chat ${chat.title}.`);
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

	async getTemporaryChat(withUserId: User["id"]): Promise<TemporaryChat | void> {
		const withUser = await this.requestUserById(withUserId);
		if (!withUser) return;

		const chat: TemporaryChat = {
			participants: [{ user: withUser }],
			participant_count: 2,
			type: ChatType.TEMP
		};

		return chat;
	}

	async createMessage(creatorId: User["id"], payload: CreateMessageDto) {
		const getChatResult = await this.getChat({
			currentUserId: creatorId,
			polymorphicId: payload.polymorphicId
		});

		let chat = getChatResult.chat;

		if (getChatResult.error) return;

		let hasBeenCreated = false;
		if (!chat) {
			chat = await this.createLocalChat({
				creatorId,
				participantId: payload.polymorphicId
			});
			hasBeenCreated = true;
			this.logger.log(`[createMessage]: Created local chat ${chat.id}.`);
		}

		const message = await this.messageService.createMessage({
			creatorId,
			chatId: chat.id,
			text: payload.text,
			fileIds: payload.fileIds,
			replyForId: payload.replyForId
		});

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

	// * Microservice requests.
	async requestUserById(userId: User["id"]): Promise<User | void> {
		const user$ = this.authService.send<User, User["id"]>(
			{ cmd: "get-user-by-id" },
			userId
		);

		return await firstValueFrom(user$).catch(e => this.logger.error(e));
	}
}
