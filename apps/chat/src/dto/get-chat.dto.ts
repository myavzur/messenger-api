import { Chat, User } from "@app/shared/entities";

export class GetChatDto {
	userId: User["id"];
	chatId: Chat["id"];
}
