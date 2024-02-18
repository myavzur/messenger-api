import { Injectable, Logger } from "@nestjs/common";
import { DataSource, In } from "typeorm";

import { Attachment } from "../entities";

import {
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

	async createAttachment(
		params: ICreateAttachmentParams
	): Promise<Attachment["id"]> {
		const insertResult = await this.insert({
			file_name: params.fileName,
			file_size: params.fileSize,
			file_type: params.fileType,
			file_url: params.fileUrl,
			tag: params.tag,
			user: { id: params.creatorId }
		});
		return insertResult.raw[0].id;
	}

	async updateAttachmentsRelation(
		params: IUpdateAttachmentsRelationParams
	): Promise<void> {
		await this.update(
			{
				id: In(params.attachmentIds),
				user: { id: params.currentUserId }
			},
			{
				message: { id: params.messageId },
				chat: { id: params.chatId }
			}
		);
	}
}
