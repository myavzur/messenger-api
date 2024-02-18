import { Attachment, Chat, Message, User } from "@app/shared/entities";

export class CreateMessageDto {
	polymorphicId: Chat["id"] | User["id"];
	text: string;
	replyForId?: Message["id"];
	attachmentIds?: Attachment["id"][];
}
