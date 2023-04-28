import { User } from "@app/shared/entities";

export interface ConnectedUser {
	userId: User["id"];
	socketId: string;
}
