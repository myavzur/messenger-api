import { User } from "@app/shared/entities";

import { ConnectedChatUser, ConnectedPresenceUser, UnusedFile } from "./interfaces";

// Payloads
export interface GetUnusedFilesPayload {
	userId: User["id"];
}

export interface AddUnusedFilesPayload {
	userId: User["id"];
	files: UnusedFile[];
}

export interface DeleteUnusedFilesPayload {
	userId: User["id"];
	fileIds: UnusedFile["id"][];
}

// Results
export type GetChatUserResult = ConnectedChatUser | undefined;
export type GetPresenceUserResult = ConnectedPresenceUser | undefined;
export type GetUnusedFilesResult = UnusedFile[] | undefined;

export interface IRedisService {
	setChatUser(payload: ConnectedChatUser): Promise<void>;
	getChatUser(payload: User["id"]): Promise<GetChatUserResult>;
	deleteChatUser(payload: User["id"]): Promise<void>;

	setPresenceUser(payload: ConnectedPresenceUser): Promise<void>;
	getPresenceUser(payload: User["id"]): Promise<GetPresenceUserResult>;
	deletePresenceUser(payload: User["id"]): Promise<void>;

	getUnusedFiles(payload: GetUnusedFilesPayload): Promise<GetUnusedFilesResult>;
	addUnusedFiles(payload: AddUnusedFilesPayload): Promise<void>;
	deleteUnusedFiles(payload: DeleteUnusedFilesPayload): Promise<void>;
}
