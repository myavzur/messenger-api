import { GetChatDto, GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, ChatType, User } from "../entities";

export interface ICreateChatParams {
	creatorId: User["id"];
	participantsIds: User["id"][];
	title?: Chat["title"];
	type: ChatType;
}

export interface IDeleteChatParams {
	chatId: Chat["id"];
}

export interface IUpdateChatParticipantsParams {
	chatId: Chat["id"];
	creatorId?: User["id"];
	participantsIds: User["id"][];
}

export interface IChatRepository {
	createChat(params: ICreateChatParams): Promise<Chat>;
	deleteChat(params: IDeleteChatParams): Promise<void>;

	createParticipants(params: IUpdateChatParticipantsParams): Promise<Chat | null>;
	deleteParticipants(params: IUpdateChatParticipantsParams): Promise<void>;

	getUserChats(params: GetUserChatsDto): Promise<PaginatedChatsDto>;
	getChat(params: GetChatDto): Promise<Chat>;
	getLocalChat(userIds: User["id"][]): Promise<Chat>;
	getLocalChats(userId: User["id"]): Promise<Chat[]>;
}
