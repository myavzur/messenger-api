import { GetUserChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, ChatType, Message, User } from "../entities";

export interface CreateChatPayload {
	creatorId: User["id"];
	participantsIds: User["id"][];
	type: ChatType;
	title?: Chat["title"];
}

export interface DeleteChatPayload {
	chatId: Chat["id"];
}

export interface UpdateChatLastMessagePayload {
	chatId: Chat["id"];
	lastMessage: Message;
}

export interface UpdateChatParticipantsPayload {
	chatId: Chat["id"];
	creatorId?: User["id"];
	participantsIds: User["id"][];
}

export interface IChatRepository {
	createChat(payload: CreateChatPayload): Promise<Chat>;
	deleteChat(payload: DeleteChatPayload): Promise<void>;
	updateChatLastMessage(payload: UpdateChatLastMessagePayload): Promise<void>;

	createParticipants(payload: UpdateChatParticipantsPayload): Promise<Chat | null>;
	deleteParticipants(payload: UpdateChatParticipantsPayload): Promise<void>;

	getUserChats(payload: GetUserChatsDto): Promise<PaginatedChatsDto>;
	getLocalChatBetweenTwoUsers(payload: User["id"][]): Promise<Chat>;
	getUserLocalChats(payload: User["id"]): Promise<Chat[]>;
}
