import { GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, User } from "../entities";

export interface IUpdateUsersParams {
	chatId: Chat["id"];
	userIds: User["id"][];
}

export interface IChatRepository {
	getLocalChat(userIds: User["id"][]): Promise<Chat>;
	getLocalChats(userId: User["id"]): Promise<Chat[]>;
	getAllChats(params: GetUserChatsDto): Promise<PaginatedChatsDto>;
}
