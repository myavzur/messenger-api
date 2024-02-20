import { Chat, File, Message, User } from "@app/shared/entities";

export class CreateMessageDto {
	polymorphicId: Chat["id"] | User["id"];
	text?: string;
	replyForId?: Message["id"];
	fileIds?: File["id"][];
}
