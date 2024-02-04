import { Chat, ChatType, User } from "@app/shared/entities";

export class GetChatDto {
	currentUserId: User["id"];
	polymorphicId: Chat["id"] | User["id"];
}
