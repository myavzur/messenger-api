import { User } from "@app/shared/entities";

export enum UserStatus {
	INVISIBLE,
	ONLINE
}

export interface ConnectedPresenceUser {
	userId: User["id"];
	socketId: string;
	status: UserStatus;
}
