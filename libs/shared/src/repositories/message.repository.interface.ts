import { Chat, ChatParticipantRole, ChatType, Message, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface IGetMessageParams {
	chatId: Chat["id"];
	messageId: Message["id"];
}

export interface ICreateMessageParams {
	chatId: Chat["id"];
	creatorId: User["id"];
	replyForId?: Message["id"];
	text: Message["text"];
}

export interface IDeleteMessagesParams {
	removerId: User["id"];
	removerChatRole: ChatParticipantRole;
	chatId: Chat["id"];
	chatType: ChatType;
	messageIds: Message["id"][];
}

export interface IMessageRepository extends IBaseRepository<Message> {
	getMessage(params: IGetMessageParams): Promise<Message>;
	createMessage(params: ICreateMessageParams): Promise<Message["id"]>;
	deleteMessages(params: IDeleteMessagesParams): Promise<Message["id"][]>;
}
