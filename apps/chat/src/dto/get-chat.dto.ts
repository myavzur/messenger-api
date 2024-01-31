import { Chat, User } from "@app/shared/entities";

export class GetAnyChatDto {
	userId: User["id"];
	chatId: Chat["id"];
}
