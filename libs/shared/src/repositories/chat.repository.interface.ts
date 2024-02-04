import { GetChatDto, GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, User } from "../entities";

export interface IUpdateChatUsersParams {
	chatId: Chat["id"];
	userIds: User["id"][];
}

export interface IChatRepository {
	getUserChats(params: GetUserChatsDto): Promise<PaginatedChatsDto>;
	getChat(params: GetChatDto): Promise<Chat>;
	getLocalChat(userIds: User["id"][]): Promise<Chat>;
	getLocalChats(userId: User["id"]): Promise<Chat[]>;
}
