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
		super(User, dataSource.createEntityManager());
	}

	/** Find conversation between two users. */
	async findConversation(
		userId: User['id'],
		withUserId: User['id']
	): Promise<Chat> {
		return await this.createQueryBuilder("chat")
			.leftJoin("chat.users", "user")
			.where("user.id IN (:userId, :withUserId)", { userId, withUserId })
			.groupBy("chat.id")
			.having("COUNT(*) = 2")
			.getOne();
	}

	/** Find chats where user consists of.
	  * @returns chat.users without object of userId.
	  */
	async findChats(payload: GetChatsDto): Promise<PaginatedChatsDto> {
		// Get chats where {userId} is a member.
		const chatsSubquery = await this.createQueryBuilder("chatsSubquery")
			.select("chatsSubquery.id")
			.innerJoin("chatsSubquery.users", "user")
			.where("user.id = :userId", { userId: payload.userId })
			.getQuery();

		const limit = pagination.getLimit(payload.limit, MAX_CHATS_LIMIT_PER_PAGE);
		const page = pagination.getPage(payload.page);

		// Get chats with filtered chat.users (without {userId}).
		const [chats, totalChats] = await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.users", "user")
			.leftJoinAndSelect("chat.messages", "message")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.leftJoinAndSelect("message.user", "message_user")
			.where(`chat.id IN (${chatsSubquery})`)
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
