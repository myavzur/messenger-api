import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateAvatarPayload } from "apps/auth/src/auth.service.interface";
import { firstValueFrom } from "rxjs";

import { RedisService } from "@app/redis";
import {
	GetUnusedFilesPayload,
	GetUnusedFilesResult
} from "@app/redis/redis.service.interface";
import { File, FileTag } from "@app/shared/entities";
import { FileRepository } from "@app/shared/repositories";
import { CreateFilePayload } from "@app/shared/repositories/file.repository.interface";

import {
	ConfirmFilesAttachedPayload,
	CreateAvatarPayload,
	DeleteFilesPayload,
	IFileService
} from "./file.service.interface";

@Injectable()
export class FileService implements IFileService {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		@InjectRepository(FileRepository)
		private readonly fileRepository: FileRepository,
		private readonly redisService: RedisService
	) {}

	logger: Logger = new Logger(FileService.name);

	// * Base
	async getUnusedFiles(
		payload: GetUnusedFilesPayload
	): Promise<GetUnusedFilesResult> {
		return await this.redisService.getUnusedFiles(payload);
	}

	/** Deletes files from Postgres and Redis. */
	async deleteFiles(payload: DeleteFilesPayload): Promise<void> {
		await this.fileRepository.deleteFiles({
			userId: payload.userId,
			fileIds: payload.fileIds
		});

		await this.redisService.deleteUnusedFiles({
			userId: payload.userId,
			fileIds: payload.fileIds
		});
	}

	async confirmFilesAttached(payload: ConfirmFilesAttachedPayload): Promise<void> {
		await this.fileRepository.updateFilesRelation({
			fileIds: payload.fileIds,
			userId: payload.userId,
			messageId: payload.messageId,
			chatId: payload.chatId
		});

		await this.redisService.deleteUnusedFiles({
			userId: payload.userId,
			fileIds: payload.fileIds
		});
	}

	// * Message Files
	async createMessageAttachment(payload: CreateFilePayload): Promise<File["id"]> {
		const file = await this.fileRepository.createFile(payload);

		await this.redisService.addUnusedFiles({
			userId: payload.userId,
			files: [
				{
					id: file.id,
					fileUrl: file.file_url
				}
			]
		});

		return file.id;
	}

	// * Avatars
	async createAvatar(payload: CreateAvatarPayload): Promise<File["id"]> {
		const file = await this.fileRepository.createFile({
			...payload,
			tag: FileTag.AVATAR
		});

		const updateAvatarResult$ = this.authService.send<void, UpdateAvatarPayload>(
			{ cmd: "update-user-avatar" },
			{
				user_id: payload.userId,
				file_id: file.id
			}
		);

		await firstValueFrom(updateAvatarResult$).catch(e => this.logger.error(e));

		return file.id;
	}
}
