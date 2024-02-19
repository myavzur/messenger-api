import { Attachment, User } from "@app/shared/entities";

export interface ConfirmUnusedFilesParams {
	userId: User["id"];
	unusedFileIds: Attachment["id"][];
}
