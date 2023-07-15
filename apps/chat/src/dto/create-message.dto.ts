import { Chat, User } from "@app/shared/entities";

export class CreateMessageDto {
	text: string;
	chatId?: Chat["id"];
	toUserId?: User["id"];
}
