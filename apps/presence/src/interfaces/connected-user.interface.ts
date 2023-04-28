import { User } from "@app/shared/entities";

export interface ConnectedUser {
	id: User["id"];
	socketId: string;
	status: ConnectedUserStatus;
}

export enum ConnectedUserStatus {
	OFFLINE,
	ONLINE
}
