import { Chat, User } from "@app/shared/entities";

export class CreateMessageDto {
	userId?: User["id"];
	chatId?: Chat["id"];
	text: string;
}
