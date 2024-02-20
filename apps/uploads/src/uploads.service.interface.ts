import { File, FileTag, User } from "@app/shared/entities";

import { ConfirmFilesAttachedPayload } from "./services/file.service.interface";

export interface SaveFileResult {
	fileName: File["file_name"];
	fileSize: File["file_size"];
	fileUrl: File["file_url"];
	fileType: File["file_type"];
}

// Payloads
export interface UploadMessageAttachmentPayload {
	userId: User["id"];
	file: Express.Multer.File;
	tag: FileTag;
}

export interface UploadAvatarPayload {
	userId: User["id"];
	file: Express.Multer.File;
}

// Results
export interface UploadFileResult {
	file_id: File["id"];
}

export interface IUploadsService {
	uploadMessageAttachment(
		payload: UploadMessageAttachmentPayload
	): Promise<UploadFileResult>;
	confirmFilesAttached(payload: ConfirmFilesAttachedPayload): Promise<void>;
	deleteUnusedFiles(payload: User["id"]): Promise<void>;

	// * Avatars
	uploadAvatar(payload: UploadAvatarPayload): Promise<UploadFileResult>;
}
