import { User } from "@app/shared/entities";

export interface FlushUnusedAttachmentsPayload {
	userId: User["id"];
}
