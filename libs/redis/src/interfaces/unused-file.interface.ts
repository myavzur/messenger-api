import { File } from "@app/shared/entities";

export interface UnusedFile {
	id: File["id"];
	fileUrl: File["file_url"];
}
