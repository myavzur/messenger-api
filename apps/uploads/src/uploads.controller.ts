import {
	Controller,
	Post,
	Query,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	ValidationPipe
} from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
import { FileInterceptor } from "@nestjs/platform-express";

import { RabbitMQService } from "@app/rabbitmq";
import { User } from "@app/shared/entities";
import { AuthGuard } from "@app/shared/guards";
import { UserInterceptor } from "@app/shared/interceptors";
import { UserRequest } from "@app/shared/interfaces";

import { UploadMessageAttachmentQueryDto } from "./dto";
import { ConfirmFilesAttachedPayload } from "./services/file.service.interface";
import { UploadsService } from "./uploads.service";
import { UploadFileResult } from "./uploads.service.interface";

@Controller("upload")
@UseGuards(AuthGuard)
export class UploadsController {
	constructor(
		private readonly rabbitmqService: RabbitMQService,
		private readonly uploadsService: UploadsService
	) {}

	@Post("m-attachment")
	@UseInterceptors(FileInterceptor("file"), UserInterceptor)
	async uploadMessageAttachment(
		@Req() request: UserRequest,
		@UploadedFile() file: Express.Multer.File,
		@Query(
			new ValidationPipe({
				transform: true,
				transformOptions: {
					enableImplicitConversion: true
				},
				forbidNonWhitelisted: true
			})
		)
		query: UploadMessageAttachmentQueryDto
	): Promise<UploadFileResult> {
		return await this.uploadsService.uploadMessageAttachment({
			file,
			userId: request.user.id,
			tag: query.tag
		});
	}

	@Post("avatar")
	@UseInterceptors(FileInterceptor("file"), UserInterceptor)
	async uploadAvatar(
		@Req() request: UserRequest,
		@UploadedFile() file: Express.Multer.File
	): Promise<UploadFileResult> {
		return await this.uploadsService.uploadAvatar({
			userId: request.user.id,
			file
		});
	}

	@MessagePattern({ cmd: "confirm-files-attached" })
	async confirmFilesAttached(
		@Ctx() context: RmqContext,
		@Payload() payload: ConfirmFilesAttachedPayload
	): Promise<void> {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.uploadsService.confirmFilesAttached(payload);
	}

	@MessagePattern({ cmd: "delete-unused-files" })
	async flushUnusedFiles(
		@Ctx() context: RmqContext,
		@Payload() payload: User["id"]
	): Promise<void> {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.uploadsService.deleteUnusedFiles(payload);
	}
}
