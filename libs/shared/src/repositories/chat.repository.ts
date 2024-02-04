import { Injectable, Logger } from "@nestjs/common";
import { GetChatDto, GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";
import { DataSource } from "typeorm";

import { Chat, ChatType, User } from "../entities";
import { ChatUser } from "../entities/chat-user.entity";
import { pagination } from "../helpers";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import { IChatRepository } from "./chat.repository.interface";

const MAX_CHATS_PER_PAGE_LIMIT = 20;

/* Useful information about subqueries cna be found in Typeorm docs:
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

	/** Get all chats in which the user participates. */
	async getUserChats(params: GetUserChatsDto): Promise<PaginatedChatsDto> {
		const { page, limit, userId } = params;

		const currentPage = pagination.getPage(page);
		const currentLimit = pagination.getLimit(limit, MAX_CHATS_PER_PAGE_LIMIT);

		const [chats, totalChats] = await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.leftJoinAndSelect("last_message.user", "last_message_user")
			.leftJoinAndSelect("chat.users", "chatUser")
			.leftJoinAndSelect("chatUser.user", "user")
			.where(qb => {
				const subQuery = qb
					.subQuery()
					.select("chat_user.chat_id")
					.from(ChatUser, "chat_user")
					.where("chat_user.user_id = :userId", { userId })
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
				relations: { users: {  }, last_message: true }
			});
		};

		const getTemporaryChat = async (userIds: User["id"][]): Promise<Chat> => {
			const users = (await Promise.all(
				userIds.map(userId =>
					this.dataSource.getRepository(User).findOneBy({ id: userId })
				)
			)) as User[];

			return {
				users: users,
				users_count: users.length,
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
		if (!chat) chat = await getTemporaryChat([currentUserId, polymorphicId]);

		return chat;
	}

	async getLocalChats(userId: User["id"]): Promise<Chat[]> {
		const chatsIdsQuery = await this.createQueryBuilder("chatsIdsQuery")
			.select("chatsIdsQuery.id")
			.innerJoin("chatsIdsQuery.users", "user")
			.where("user.id = :userId", { userId: userId })
			.andWhere("is_group = false")
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
			.where("chat.is_group = false")
			.andWhere("user.id = :firstUserId", { firstUserId: userIds[0] })
			.andWhere("user.id = :secondUserId", { secondUserId: userIds[1] })
			.getOne();
	}
}
