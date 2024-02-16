import { IsEnum, IsNotEmpty } from "class-validator";

import { AttachmentTag } from "@app/shared/entities";

export class UploadMessageAttachmentQueryDto {
	@IsEnum(
		[
			AttachmentTag.FILE,
			AttachmentTag.MEDIA,
			AttachmentTag.VOICE,
			AttachmentTag.CIRCLE
		],
		{
			message:
				"Invalid tag. Tag must be one of the following values: file, media, voice, circle"
		}
	)
	@IsNotEmpty()
	tag: AttachmentTag;
}
