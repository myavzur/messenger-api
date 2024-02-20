import { ChatParticipant, ChatType, User } from "@app/shared/entities";

export interface TemporaryChat {
	type: ChatType.TEMP;
	participants: { user: User }[];
	participant_count: 2;
}
