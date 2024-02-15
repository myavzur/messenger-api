import {
	Controller,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { AuthGuard } from "@app/shared/guards";

import { UploadFolders } from "./interfaces";
import { UploadsService } from "./uploads.service";

@Controller()
export class UploadsController {
	constructor(private readonly uploadsService: UploadsService) {}

	@Post()
	@UseGuards(AuthGuard)
	@UseInterceptors(FileInterceptor("file"))
	async uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@Query("folder") folder?: UploadFolders
	) {
		return await this.uploadsService.saveFile(file, folder);
	}
}
