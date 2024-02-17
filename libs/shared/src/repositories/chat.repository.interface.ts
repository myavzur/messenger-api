import { GetChatDto, GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, ChatType, Message, User } from "../entities";

export interface ICreateChatParams {
	creatorId: User["id"];
	participantsIds: User["id"][];
	title?: Chat["title"];
	type: ChatType;
}

export interface IDeleteChatParams {
	chatId: Chat["id"];
}

export interface IUpdateChatLastMessageParams {
	chatId: Chat["id"];
	lastMessage: Message;
}

export interface IUpdateChatParticipantsParams {
	chatId: Chat["id"];
	creatorId?: User["id"];
	participantsIds: User["id"][];
}

export interface IChatRepository {
	createChat(params: ICreateChatParams): Promise<Chat>;
	deleteChat(params: IDeleteChatParams): Promise<void>;
	updateChatLastMessage(params: IUpdateChatLastMessageParams): Promise<void>;

	createParticipants(params: IUpdateChatParticipantsParams): Promise<Chat | null>;
	deleteParticipants(params: IUpdateChatParticipantsParams): Promise<void>;

	getUserChats(params: GetUserChatsDto): Promise<PaginatedChatsDto>;
	getLocalChat(userIds: User["id"][]): Promise<Chat>;
	getUserLocalChats(userId: User["id"]): Promise<Chat[]>;
}
