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
		toUserId: User['id']
	): Promise<Chat> {
		return await this.findOne({
			where: {
				users: [
					{ id: userId },
					{ id: toUserId }
				],
				is_group: false
			},
			relations: {
				users: true,
				last_message: true
			}
		});
	}

	/** Find chats where user consists of. */
	async findChats(payload: GetChatsDto): Promise<PaginatedChatsDto> {
		const limit = pagination.getLimit(payload.limit, MAX_CHATS_LIMIT_PER_PAGE);
		const page = pagination.getPage(payload.page);

		// Get chats where {userId} is a member.
		const chatsIdsQuery = await this.createQueryBuilder("chatsIdsQuery")
			.select("chatsIdsQuery.id")
			.innerJoin("chatsIdsQuery.users", "user")
			.where("user.id = :userId", { userId: payload.userId })
			.getQuery();

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
