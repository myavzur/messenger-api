import { Attachment } from "@app/shared/entities";

export interface SaveFileResponse {
	fileName: Attachment["file_name"];
	fileSize: Attachment["file_size"];
	fileUrl: Attachment["file_url"];
	fileType: Attachment["file_type"];
}
