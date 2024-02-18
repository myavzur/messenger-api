import { Attachment, AttachmentTag, Chat, Message, User } from "../entities";

export interface ICreateAttachmentParams {
	tag: AttachmentTag;
	creatorId: User["id"];
	fileName: Attachment["file_name"];
	fileSize: Attachment["file_size"];
	fileType: Attachment["file_type"];
	fileUrl: Attachment["file_url"];
}

export interface IUpdateAttachmentsRelationParams {
	currentUserId: User["id"];
	attachmentIds: Attachment["id"][];
	messageId: Message["id"];
	chatId: Chat["id"];
}

export interface IAttachmentsRepository {
	createAttachment(params: ICreateAttachmentParams): Promise<Attachment["id"]>;
	updateAttachmentsRelation(params: IUpdateAttachmentsRelationParams): Promise<void>;
}
