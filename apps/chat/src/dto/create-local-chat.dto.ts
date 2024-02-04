import { User } from "@app/shared/entities";

export class CreateLocalChatDto {
	creatorId: User["id"];
	participantId: User["id"];
}
