import { Attachment } from "@app/shared/entities";

export interface UnusedFile {
	id: Attachment["id"];
	fileUrl: Attachment["file_url"];
}
