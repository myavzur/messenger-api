import { Chat, File, FileTag, Message, User } from "../entities";

export interface CreateFilePayload {
	userId: User["id"];
	tag: FileTag;
	fileName: File["file_name"];
	fileSize: File["file_size"];
	fileType: File["file_type"];
	fileUrl: File["file_url"];
}

export interface IUpdateFilesRelationPayload {
	fileIds: File["id"][];
	userId: User["id"];
	messageId: Message["id"];
	chatId: Chat["id"];
}

export interface DeleteFilesPayload {
	fileIds: File["id"][];
	userId: User["id"];
}

export interface IFilesRepository {
	createFile(payload: CreateFilePayload): Promise<File>;
	updateFilesRelation(payload: IUpdateFilesRelationPayload): Promise<any>;
	deleteFiles(payload: DeleteFilesPayload): Promise<void>;
}
