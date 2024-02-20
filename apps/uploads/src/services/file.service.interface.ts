import {
	GetUnusedFilesPayload,
	GetUnusedFilesResult
} from "@app/redis/redis.service.interface";
import { Chat, File, Message, User } from "@app/shared/entities";
import { CreateFilePayload } from "@app/shared/repositories/file.repository.interface";

export interface ConfirmFilesAttachedPayload {
	userId: User["id"];
	chatId: Chat["id"];
	messageId: Message["id"];
	fileIds: File["id"][];
}

export interface DeleteFilesPayload {
	userId: User["id"];
	fileIds: File["id"][];
}

export type CreateAvatarPayload = Omit<CreateFilePayload, "tag">;

export interface IFileService {
	getUnusedFiles(payload: GetUnusedFilesPayload): Promise<GetUnusedFilesResult>;
	deleteFiles(payload: DeleteFilesPayload): Promise<void>;
	confirmFilesAttached(payload: ConfirmFilesAttachedPayload): Promise<void>;

	createMessageAttachment(payload: CreateFilePayload): Promise<File["id"]>;
	createAvatar(payload: CreateAvatarPayload): Promise<File["id"]>;
}
