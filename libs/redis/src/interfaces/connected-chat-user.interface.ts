import { User } from "@app/shared/entities";

export interface ConnectedChatUser {
	userId: User["id"];
	socketId: string;
}
