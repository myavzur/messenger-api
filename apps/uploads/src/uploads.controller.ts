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
import { FileInterceptor } from "@nestjs/platform-express";

import { AttachmentTag } from "@app/shared/entities";
import { AuthGuard } from "@app/shared/guards";
import { UserInterceptor } from "@app/shared/interceptors";
import { UserRequest } from "@app/shared/interfaces";

import { UploadMessageAttachmentQueryDto } from "./dto";
import { UploadsService } from "./uploads.service";

@Controller()
@UseGuards(AuthGuard)
export class UploadsController {
	constructor(private readonly uploadsService: UploadsService) {}

	@Post("message-attachment")
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
}
