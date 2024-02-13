import { Chat, ChatParticipantRole, ChatType, Message, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface ICreateMessageParams {
	replyForId?: Message["id"];
	creatorId: User["id"];
	text: Message["text"];
	chat: Chat;
}

export interface IDeleteMessagesParams {
	removerId: User["id"];
	removerChatRole: ChatParticipantRole;
	chatId: Chat["id"];
	chatType: ChatType;
	messageIds: Message["id"][];
}

export interface IMessageRepository extends IBaseRepository<Message> {
	createMessage(params: ICreateMessageParams): Promise<Message>;
	deleteMessages(params: IDeleteMessagesParams): Promise<Message["id"][]>;
}
