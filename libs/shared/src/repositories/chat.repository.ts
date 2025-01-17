import { Injectable, Logger } from "@nestjs/common";
import { GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";
import { DataSource } from "typeorm";

import {
	Chat,
	ChatParticipant,
	ChatParticipantRole,
	ChatType,
	User
} from "@app/shared/entities";
import { pagination } from "@app/shared/helpers";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	CreateChatPayload,
	DeleteChatPayload,
	IChatRepository,
	UpdateChatLastMessagePayload,
	UpdateChatParticipantsPayload
} from "./chat.repository.interface";

const MAX_CHATS_PER_PAGE_LIMIT = 20;

/* Useful information about subqueries can be found in Typeorm docs:
 * https://orkhan.gitbook.io/typeorm/docs/select-query-builder#using-subqueries */
@Injectable()
export class ChatRepository
	extends BaseRepositoryAbstract<Chat>
	implements IChatRepository
{
	constructor(private dataSource: DataSource) {
		super(Chat, dataSource.createEntityManager());
	}

	logger: Logger = new Logger(ChatRepository.name);

	async createChat(payload: CreateChatPayload): Promise<Chat> {
		const { creatorId, participantsIds, title, type } = payload;

		const chat = await this.save({ title: title?.trim(), type });

		await this.createParticipants({
			chatId: chat.id,
			creatorId,
			participantsIds
		});

		return await this.findOne({
			where: { id: chat.id },
			relations: {
				last_message: {
					user: true
				}
			}
		});
	}

	async deleteChat(payload: DeleteChatPayload): Promise<void> {
		const { chatId } = payload;
		await this.delete({ id: chatId });
	}

	async updateChatLastMessage(payload: UpdateChatLastMessagePayload): Promise<void> {
		const { chatId, lastMessage } = payload;
		await this.update({ id: chatId }, { last_message: lastMessage });
	}

	async createParticipants(
		payload: UpdateChatParticipantsPayload
	): Promise<Chat | null> {
		const { chatId, creatorId, participantsIds } = payload;

		const chat = await this.findOne({
			where: { id: chatId },
			relations: { participants: true }
		});
		if (!chat) return null;

		const creatorParticipant = creatorId && new ChatParticipant();
		if (creatorParticipant) {
			creatorParticipant.role = ChatParticipantRole.OWNER;
			creatorParticipant.user = { id: creatorId } as User;
			creatorParticipant.chat = { id: chat.id } as Chat;
			await this.dataSource.manager.save(creatorParticipant);
		}

		const participants = (await Promise.all(
			participantsIds.map(participantId => {
				const participant = new ChatParticipant();
				participant.role = ChatParticipantRole.PARTICIPANT;
				participant.user = { id: participantId } as User;
				participant.chat = { id: chat.id } as Chat;
				return this.dataSource.manager.save(participant);
			})
		)) as ChatParticipant[];

		chat.participants = [...chat.participants, ...participants, creatorParticipant];
		chat.participants_count = chat.participants.length;

		await this.manager.save(chat);
	}

	async deleteParticipants(payload: UpdateChatParticipantsPayload): Promise<void> {
		const { chatId, participantsIds } = payload;

		const chat = await this.findOne({
			where: { id: chatId },
			relations: { participants: true }
		});

		chat.participants = chat.participants.filter(participant => {
			const shouldDelete = participantsIds.includes(participant.user.id);
			const isOwner = participant.role === ChatParticipantRole.OWNER;
			// Impossible to kick the owner.
			return !shouldDelete || isOwner;
		});
		chat.participants_count = chat.participants.length;

		await this.save(chat);
	}

	/** Get all chats in which the user participates. */
	async getUserChats(payload: GetUserChatsDto): Promise<PaginatedChatsDto> {
		const { page, limit, userId } = payload;

		const currentPage = pagination.getPage(page);
		const currentLimit = pagination.getLimit(limit, MAX_CHATS_PER_PAGE_LIMIT);

		const [chats, totalChats] = await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.participants", "participant")
			.leftJoinAndSelect("participant.user", "user")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.leftJoinAndSelect("last_message.user", "last_message_user")
			.where(qb => {
				const subQuery = qb
					.subQuery()
					.select("participant.chat_id")
					.from(ChatParticipant, "participant")
					.where("participant.user_id = :userId", { userId })
					.getQuery();
				return `chat.id IN ${subQuery}`;
			})
			.orderBy("chat.updated_at", "DESC")
			.skip((currentPage - 1) * currentLimit)
			.take(currentLimit)
			.getManyAndCount();

		const totalPages = Math.ceil(totalChats / currentLimit);

		return {
			chats,
			totalItems: totalChats,
			totalPages,
			currentPage
		};
	}

	async getUserLocalChats(payload: User["id"]): Promise<Chat[]> {
		const chatsIdsQuery = await this.createQueryBuilder("chat")
			.select("chat.id")
			.innerJoin("chat.participants", "participant")
			.where("participant.user_id = :userId", { userId: payload })
			.andWhere("type = :chatType", { chatType: ChatType.LOCAL })
			.getQuery();

		return await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.participants", "participant")
			.where(`chat.id IN (${chatsIdsQuery})`)
			.getMany();
	}

	async getLocalChatBetweenTwoUsers(payload: User["id"][]): Promise<Chat> {
		if (payload.length !== 2) {
			this.logger.error(
				"[getLocalChatBetweenTwoUsers]: Not enough or Too much IDs passed."
			);
			return;
		}

		const chats = await this.dataSource.query(
			`
				SELECT chat.id FROM chats chat
				JOIN chats_has_participants participant1
					ON participant1.chat_id = chat.id
				JOIN chats_has_participants participant2
					ON participant2.chat_id = chat.id
				WHERE
					participant1.user_id = $1
					AND
					participant2.user_id = $2
					AND chat.type = 'local'
					AND chat.participants_count = 2
			`,
			[payload[0], payload[1]]
		);

		const chatId = chats[0]?.id;
		if (!chatId) return;

		return await this.findOne({
			where: { id: chatId },
			relations: {
				participants: true
			}
		});
	}
}
