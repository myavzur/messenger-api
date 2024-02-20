import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfirmFilesAttachedPayload } from "apps/uploads/src/services/file.service.interface";
import { firstValueFrom } from "rxjs";

import { Chat, File, Message, User } from "@app/shared/entities";
import { pagination } from "@app/shared/helpers";
import { ChatRepository, MessageRepository } from "@app/shared/repositories";

import { DeleteMessagesDto, PaginatedMessagesDto } from "../dto";

const MESSAGES_PER_REQUEST_LIMIT = 70;

@Injectable()
export class MessageService {
	constructor(
		@Inject("UPLOADS_SERVICE")
		private readonly uploadsService: ClientProxy,
		@InjectRepository(ChatRepository)
		private readonly chatRepository: ChatRepository,
		@InjectRepository(MessageRepository)
		private readonly messageRepository: MessageRepository
	) {}

	logger: Logger = new Logger(MessageService.name);

	async getMessage(messageId: Message["id"]) {
		return await this.messageRepository.findOne({
			where: {
				id: messageId
			},
			relations: {
				reply_for: {
					user: true
				}
			}
		});
	}

	async getMessagesPaginated(payload: {
		chatId: Chat["id"];
		page: number;
		limit?: number;
	}): Promise<PaginatedMessagesDto> {
		const currentPage = pagination.getPage(payload.page);
		const currentLimit = pagination.getLimit(
			payload.limit,
			MESSAGES_PER_REQUEST_LIMIT
		);

		const [messages, totalItems] = await this.messageRepository.findAndCount({
			where: { chat: { id: payload.chatId } },
			skip: (currentPage - 1) * currentLimit,
			take: currentLimit,
			order: {
				created_at: "DESC"
			},
			relations: {
				reply_for: {
					user: true
				}
			}
		});

		return {
			messages,
			currentPage,
			totalPages: pagination.getTotalPages(totalItems, currentLimit),
			totalItems
		};
	}

	// TODO: Make types
	async createMessage(payload: {
		chatId: Chat["id"];
		creatorId: User["id"];
		text: Message["text"];
		replyForId?: Message["id"];
		fileIds?: File["id"][];
	}): Promise<Message> {
		const messageId = await this.messageRepository.createMessage({
			chatId: payload.chatId,
			creatorId: payload.creatorId,
			text: payload.text,
			replyForId: payload.replyForId
		});

		if (payload.fileIds && payload.fileIds.length > 0) {
			const confirmFilesAttached$ = this.uploadsService.send<
				void,
				ConfirmFilesAttachedPayload
			>(
				{
					cmd: "confirm-files-attached"
				},
				{
					fileIds: payload.fileIds,
					chatId: payload.chatId,
					userId: payload.creatorId,
					messageId: messageId
				}
			);

			await firstValueFrom(confirmFilesAttached$).catch(e => {
				this.logger.error("createMessage: Failed to confirm files");
				this.logger.error(e);
			});
		}

		const message = await this.messageRepository.getMessage({
			chatId: payload.chatId,
			messageId
		});

		return message;
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
					participants.length: ${chat.participants.length};
					participants[0]: ${chat.participants[0]};
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
}
