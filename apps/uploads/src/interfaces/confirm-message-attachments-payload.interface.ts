import { Attachment, Chat, Message, User } from "@app/shared/entities";

export interface IConfirmMessageAttachmentsPayload {
	currentUserId: User["id"];
	chatId: Chat["id"];
	messageId: Message["id"];
	attachmentIds: Attachment["id"][];
}
