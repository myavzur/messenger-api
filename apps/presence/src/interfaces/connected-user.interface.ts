import { User } from "@app/shared/entities";

export interface ConnectedUser {
	userId: User["id"];
	socketId: string;
	status: ConnectedUserStatus;
}

export enum ConnectedUserStatus {
	INVISIBLE,
	ONLINE
}
