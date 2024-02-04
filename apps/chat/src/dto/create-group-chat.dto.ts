import { Chat, User } from "@app/shared/entities";

export class CreateGroupChatDto {
	creatorId: User["id"];
	participantsIds: User["id"][];
	title: Chat["title"];
}
