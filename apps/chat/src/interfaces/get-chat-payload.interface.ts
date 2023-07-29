import { Chat, User } from "@app/shared/entities";

export interface GetChatPayload {
	userId: User["id"];
	id: Chat["id"];
}
