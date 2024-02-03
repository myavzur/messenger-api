import { GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, User } from "../entities";

export interface IUpdateChatUsersParams {
	chatId: Chat["id"];
	userIds: User["id"][];
}

export interface IChatRepository {
	getUserChats(userId: User["id"]): Promise<PaginatedChatsDto>;
	getLocalChat(userIds: User["id"][]): Promise<Chat>;
	getLocalChats(userId: User["id"]): Promise<Chat[]>;
	getAllChats(params: GetUserChatsDto): Promise<PaginatedChatsDto>;
}
