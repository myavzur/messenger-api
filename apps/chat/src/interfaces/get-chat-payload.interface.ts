import { Chat, User } from "@app/shared/entities";

export interface GetChatPayload {
	userId: User["id"];
	chatId: Chat["id"];
}
