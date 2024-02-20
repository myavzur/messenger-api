import { Chat, ChatParticipantRole, ChatType, Message, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface GetMessagePayload {
	chatId: Chat["id"];
	messageId: Message["id"];
}

export interface CreateMessagePayload {
	chatId: Chat["id"];
	creatorId: User["id"];
	replyForId?: Message["id"];
	text?: Message["text"];
}

export interface DeleteMessagesPayload {
	removerId: User["id"];
	removerChatRole: ChatParticipantRole;
	chatId: Chat["id"];
	chatType: ChatType;
	messageIds: Message["id"][];
}

export interface IMessageRepository extends IBaseRepository<Message> {
	getMessage(payload: GetMessagePayload): Promise<Message>;
	createMessage(payload: CreateMessagePayload): Promise<Message["id"]>;
	deleteMessages(payload: DeleteMessagesPayload): Promise<Message["id"][]>;
}
