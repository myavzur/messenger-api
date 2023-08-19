import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository.abstract";
import { Chat, User } from "../entities";
import { IChatRepository } from "./chat.repository.interface";
import { DataSource } from "typeorm";
import { GetChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";
import { pagination } from "../helpers";

const MAX_CHATS_LIMIT_PER_PAGE = 20;

@Injectable()
export class ChatRepository
	extends BaseRepository<Chat>
	implements IChatRepository
{
	constructor(private dataSource: DataSource) {
		super(Chat, dataSource.createEntityManager());
	}

	/** Find conversation between two users. */
	async findConversation(
		userId: User['id'],
		withUserId: User['id']
	): Promise<Chat> {
		return await this.createQueryBuilder("chat")
			.leftJoin("chat.users", "user")
			.where("user.id IN (:userId, :withUserId)", { userId, withUserId })
			.andWhere("chat.is_group = false")
			.groupBy("chat.id")
			.getOne();
	}

	/** Find chats where user consists of.
	  * @returns chat.users without object of userId.
	  */
	async findChats(payload: GetChatsDto): Promise<PaginatedChatsDto> {
		// Get chats where {userId} is a member.
		const chatsIdsQuery = await this.createQueryBuilder("chatsIdsQuery")
			.select("chatsIdsQuery.id")
			.innerJoin("chatsIdsQuery.users", "user")
			.where("user.id = :userId", { userId: payload.userId })
			.getQuery();

		const limit = pagination.getLimit(payload.limit, MAX_CHATS_LIMIT_PER_PAGE);
		const page = pagination.getPage(payload.page);

		// Get chats with filtered chat.users (without {userId}).
		const [chats, totalChats] = await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.users", "user", "chat.is_group = false")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.where(`chat.id IN (${chatsIdsQuery})`)
			.andWhere("user.id != :userId", { userId: payload.userId })
			.orderBy("chat.updated_at", "DESC")
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();

		const totalPages = Math.ceil(totalChats / limit);

		return {
			chats,
			totalItems: totalChats,
			totalPages,
			currentPage: page
		};
	}
};
