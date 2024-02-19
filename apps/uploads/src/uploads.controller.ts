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
import { AttachmentTag } from "@app/shared/entities";
import { AuthGuard } from "@app/shared/guards";
import { UserInterceptor } from "@app/shared/interceptors";
import { UserRequest } from "@app/shared/interfaces";

import { UploadMessageAttachmentQueryDto } from "./dto";
import {
	FlushUnusedAttachmentsPayload,
	IConfirmMessageAttachmentsPayload
} from "./interfaces";
import { UploadsService } from "./uploads.service";

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
	) {
		return await this.uploadsService.uploadMessageAttachment(
			request.user.id,
			file,
			query.tag
		);
	}

	@Post("avatar")
	@UseInterceptors(FileInterceptor("file"), UserInterceptor)
	async uploadAvatar(
		@Req() request: UserRequest,
		@UploadedFile() file: Express.Multer.File
	) {
		return await this.uploadsService.uploadAvatar(request.user.id, file);
	}

	@MessagePattern({ cmd: "confirm-message-attachments" })
	async confirmMessageAttachments(
		@Ctx() context: RmqContext,
		@Payload() payload: IConfirmMessageAttachmentsPayload
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.uploadsService.confirmMessageAttachments(payload);
	}

	@MessagePattern({ cmd: "flush-unused-attachments" })
	async flushUnusedAttachments(
		@Ctx() context: RmqContext,
		@Payload() payload: FlushUnusedAttachmentsPayload
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.uploadsService.flushUnusedAttachments(payload);
	}
}
