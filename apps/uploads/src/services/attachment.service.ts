import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateUserAvatarPayload } from "apps/auth/src/interfaces";
import { firstValueFrom } from "rxjs";

import { RedisService } from "@app/redis";
import {
	ConfirmUnusedFilesParams,
	GetUnusedFilesParams
} from "@app/redis/interfaces/unused-files";
import { AttachmentTag } from "@app/shared/entities";
import { AttachmentRepository } from "@app/shared/repositories";
import { ICreateAttachmentParams } from "@app/shared/repositories/attachment.repository.interface";

import { IConfirmMessageAttachmentsPayload } from "../interfaces/";

@Injectable()
export class AttachmentService {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		@InjectRepository(AttachmentRepository)
		private readonly attachmentRepository: AttachmentRepository,
		private readonly cache: RedisService
	) {}

	logger: Logger = new Logger(AttachmentService.name);

	// * Base
	async getUnusedAttachments(payload: GetUnusedFilesParams) {
		return await this.cache.getUnusedFiles(payload);
	}

	/** Deletes attachments from Postgres and Redis. */
	async forgotUnusedFiles(payload: ConfirmUnusedFilesParams) {
		await this.attachmentRepository.deleteAttachments({
			userId: payload.userId,
			attachmentIds: payload.unusedFileIds
		});
		this.logger.debug("forgotUnusedFIles: removed from database");
		await this.cache.confirmUnusedFiles({
			userId: payload.userId,
			unusedFileIds: payload.unusedFileIds
		});
		this.logger.debug("forgotUnusedFIles: Forgotten from redis");
	}

	// * Message Attachments
	async saveMessageAttachment(payload: ICreateAttachmentParams) {
		const attachment = await this.attachmentRepository.createAttachment(payload);

		await this.cache.keepUnusedFiles({
			userId: payload.creatorId,
			unusedFiles: [
				{
					id: attachment.id,
					fileUrl: attachment.file_url
				}
			]
		});

		return attachment.id;
	}

	/** Ф-ция для подтверждения факта, сообщение, к которому были прикреплены файлы, отправлено.
	 * Это означает, что теперь к эти файлы можно крепить к сообщению.
	 */
	async confirmMessageAttachments(payload: IConfirmMessageAttachmentsPayload) {
		const result = await this.attachmentRepository.updateAttachmentsRelation({
			attachmentIds: payload.attachmentIds,
			currentUserId: payload.currentUserId,
			messageId: payload.messageId,
			chatId: payload.chatId
		});

		this.logger.log(result);

		await this.cache.confirmUnusedFiles({
			userId: payload.currentUserId,
			unusedFileIds: payload.attachmentIds
		});
	}

	// * Avatars
	async updateAvatar(payload: Omit<ICreateAttachmentParams, "tag">) {
		const attachment = await this.attachmentRepository.createAttachment({
			...payload,
			tag: AttachmentTag.AVATAR
		});

		const updateAvatarResult$ = this.authService.send<any, UpdateUserAvatarPayload>(
			{ cmd: "update-user-avatar" },
			{
				user_id: payload.creatorId,
				attachment_id: attachment.id
			}
		);

		await firstValueFrom(updateAvatarResult$).catch(e => this.logger.error(e));

		return attachment.id;
	}
}
