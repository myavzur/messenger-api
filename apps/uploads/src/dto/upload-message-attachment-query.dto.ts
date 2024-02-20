import { IsEnum, IsNotEmpty } from "class-validator";

import { FileTag } from "@app/shared/entities";

export class UploadMessageAttachmentQueryDto {
	@IsEnum([FileTag.FILE, FileTag.MEDIA, FileTag.VOICE, FileTag.CIRCLE], {
		message:
			"Invalid tag. Tag must be one of the following values: file, media, voice, circle"
	})
	@IsNotEmpty()
	tag: FileTag;
}
