import { User } from "@app/shared/entities";

export interface GetChatsPayload {
	userId: User["id"];
	page: number;
	limit: number;
}
