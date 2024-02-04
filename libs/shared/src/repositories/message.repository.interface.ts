import { Chat, Message, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface ICreateMessageParams {
	creatorId: User["id"];
	text: Message["text"];
	chat: Chat;
}

export interface IDeleteMessagesParams {
	removerId: User["id"];
	messageIds: Message["id"][];
}

export interface IMessageRepository extends IBaseRepository<Message> {
	createMessage(params: ICreateMessageParams): Promise<Message>;
	deleteMessages(params: IDeleteMessagesParams): Promise<void>;
}
