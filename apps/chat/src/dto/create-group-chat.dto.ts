import { Chat, User } from "@app/shared/entities";

export class CreateGroupChatDto {
	title: Chat["title"];
	userIds: User["id"][];
}
