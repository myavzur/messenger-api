import { Injectable } from "@nestjs/common";
import { GetAnyChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";
import { DataSource } from "typeorm";

import { Chat, User } from "../entities";
import { pagination } from "../helpers";

import { BaseRepository } from "./base.repository.abstract";
import { IChatRepository } from "./chat.repository.interface";

const MAX_CHATS_LIMIT_PER_PAGE = 20;

@Injectable()
export class ChatRepository extends BaseRepository<Chat> implements IChatRepository {
	constructor(private dataSource: DataSource) {
		super(Chat, dataSource.createEntityManager());
	}

	async findLocalChats(userId: User["id"]): Promise<Chat[]> {
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

	async findLocalChat(userIds: User["id"][]): Promise<Chat> {
		return await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.last_message", "last_message")
			.leftJoinAndSelect("chat.users", "user")
			.where("chat.is_group = true")
			.andWhere("user.id = :firstUserId", { firstUserId: userIds[0] })
			.andWhere("user.id = :secondUserId", { secondUserId: userIds[1] })
			.getOne();
	}

	/** Find any chats where user consists of. */
	async findAnyChats(payload: GetAnyChatsDto): Promise<PaginatedChatsDto> {
		const limit = pagination.getLimit(payload.limit, MAX_CHATS_LIMIT_PER_PAGE);
		const page = pagination.getPage(payload.page);

		// Get chat IDs where {userId} is a member.
		const chatIdsQb = await this.createQueryBuilder("chat")
			.select("chat.id")
			.innerJoin("chat.users", "user")
			.where("user.id = :userId", { userId: payload.userId })
			.andWhere("is_group = false")
			.getQuery();

		const [chats, totalChats] = await this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.users", "user", "chat.is_group = false") // Join users if chat is local
			.leftJoinAndSelect("chat.last_message", "last_message")
			.where(`chat.id IN (${chatIdsQb})`)
			.andWhere(`user.id != :userId`, { userId: payload.userId }) // Костыль
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
}
