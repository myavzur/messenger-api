import { Injectable, Logger } from "@nestjs/common";
import { GetChatDto, GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";
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
	IChatRepository,
	ICreateChatParams,
	IDeleteChatParams,
	IUpdateChatParticipantsParams
} from "./chat.repository.interface";

const MAX_CHATS_PER_PAGE_LIMIT = 20;

/* Useful information about subqueries can be found in Typeorm docs:
 * https://orkhan.gitbook.io/typeorm/docs/select-query-builder#using-subqueries
 */

@Injectable()
export class ChatRepository
	extends BaseRepositoryAbstract<Chat>
	implements IChatRepository
{
	constructor(private dataSource: DataSource) {
		super(Chat, dataSource.createEntityManager());
	}

	logger: Logger = new Logger(ChatRepository.name);

	async createChat(params: ICreateChatParams): Promise<Chat> {
		const { creatorId, participantsIds, title, type } = params;

		const owner = new ChatParticipant();
		owner.role = ChatParticipantRole.OWNER;
		owner.user.id = creatorId;

		const chat = await this.save({ title, type, participants: [owner] });
		return await this.createParticipants({ chatId: chat.id, participantsIds });
	}

	async deleteChat(params: IDeleteChatParams): Promise<void> {
		const { chatId } = params;
		await this.delete({ id: chatId });
	}

	async createParticipants(
		params: IUpdateChatParticipantsParams
	): Promise<Chat | null> {
		const { chatId, participantsIds } = params;

		const chat = await this.findOne({
			where: { id: chatId },
			relations: { participants: true }
		});
		if (!chat) return null;

		const participants = participantsIds.map(participantId => {
			const participant = new ChatParticipant();
			participant.role = ChatParticipantRole.PARTICIPANT;
			participant.user.id = participantId;
			return participant;
		});

		chat.participants = [...chat.participants, ...participants];
		chat.participants_count = chat.participants.length;

		return await this.save(chat);
	}

	async deleteParticipants(params: IUpdateChatParticipantsParams): Promise<void> {
		const { chatId, participantsIds } = params;

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
	async getUserChats(params: GetUserChatsDto): Promise<PaginatedChatsDto> {
		const { page, limit, userId } = params;

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

	async getChat(params: GetChatDto): Promise<Chat> {
		const { currentUserId, polymorphicId } = params;

		const getChat = async (chatId: Chat["id"]): Promise<Chat> => {
			return await this.findOne({
				where: { id: chatId },
				relations: {
					participants: {
						user: true
					},
					last_message: true
				}
			});
		};

		const getTemporaryChat = async (
			fromUserId: User["id"],
			toUserId: User["id"]
		): Promise<Chat> => {
			const fromUser = await this.dataSource
				.getRepository(User)
				.findOneBy({ id: fromUserId });
			const toUser = await this.dataSource
				.getRepository(User)
				.findOneBy({ id: toUserId });

			return {
				participants: [
					{
						id: "joker",
						role: ChatParticipantRole.OWNER,
						user: fromUser,
						chat: null
					},
					{
						id: "listener",
						role: ChatParticipantRole.PARTICIPANT,
						user: toUser,
						chat: null
					}
				],
				participants_count: 2,
				type: ChatType.TEMP,
				id: null,
				title: null,
				updated_at: null,
				messages: null,
				last_message: null
			};
		};

		let chat = await getChat(polymorphicId);
		if (!chat) chat = await this.getLocalChat([currentUserId, polymorphicId]);
		if (!chat) chat = await getTemporaryChat(currentUserId, polymorphicId);

		return chat;
	}

	async getLocalChats(userId: User["id"]): Promise<Chat[]> {
		const chatsIdsQuery = await this.createQueryBuilder("chatsIdsQuery")
			.select("chatsIdsQuery.id")
			.innerJoin("chatsIdsQuery.users", "user")
			.where("user.id = :userId", { userId: userId })
			.andWhere("type = :chatType", { chatType: ChatType.LOCAL })
			.getQuery();

		return await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.users", "user")
			.where(`chat.id IN (${chatsIdsQuery})`)
			.andWhere("user.id != :userId", { userId: userId })
			.getMany();
	}

	async getLocalChat(userIds: User["id"][]): Promise<Chat> {
		return await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.leftJoinAndSelect("chat.users", "user")
			.where("chat.type = :chatType", { chatType: ChatType.LOCAL })
			.andWhere("user.id = :firstUserId", { firstUserId: userIds[0] })
			.andWhere("user.id = :secondUserId", { secondUserId: userIds[1] })
			.getOne();
	}
}
