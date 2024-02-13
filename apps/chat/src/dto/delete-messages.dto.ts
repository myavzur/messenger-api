import { Chat, Message, User } from "@app/shared/entities";

export class DeleteMessagesDto {
	removerId: User["id"];
	chatId: Chat["id"];
	messageIds: Message["id"][];
}
