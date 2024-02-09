import { Chat, Message, User } from "@app/shared/entities";

export class DeleteMessagesDto {
	removerId: User["id"];
	messageIds: Message["id"][];
}
