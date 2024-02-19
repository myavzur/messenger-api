import { Injectable, Logger } from "@nestjs/common";
import { DataSource, In } from "typeorm";

import { Attachment } from "../entities";

import {
	DeleteAttachmentsParams,
	IAttachmentsRepository,
	ICreateAttachmentParams,
	IUpdateAttachmentsRelationParams
} from "./attachment.repository.interface";
import { BaseRepositoryAbstract } from "./base.repository.abstract";

@Injectable()
export class AttachmentRepository
	extends BaseRepositoryAbstract<Attachment>
	implements IAttachmentsRepository
{
	constructor(private dataSource: DataSource) {
		super(Attachment, dataSource.createEntityManager());
	}

	logger: Logger = new Logger(AttachmentRepository.name);

	async createAttachment(params: ICreateAttachmentParams): Promise<Attachment> {
		const insertResult = await this.insert({
			file_name: params.fileName,
			file_size: params.fileSize,
			file_type: params.fileType,
			file_url: params.fileUrl,
			tag: params.tag,
			user: { id: params.creatorId }
		});
		const attachmentId = insertResult.identifiers[0].id;

		return await this.findOne({ where: { id: attachmentId } });
	}

	async updateAttachmentsRelation(
		params: IUpdateAttachmentsRelationParams
	): Promise<any> {
		const result = await this.update(
			{
				id: In(params.attachmentIds),
				user: { id: params.currentUserId }
			},
			{
				message: { id: params.messageId },
				chat: { id: params.chatId }
			}
		);

		return result;
	}

	async deleteAttachments(params: DeleteAttachmentsParams): Promise<void> {
		await this.delete({
			id: In(params.attachmentIds),
			user: { id: params.userId }
		});
	}
}
