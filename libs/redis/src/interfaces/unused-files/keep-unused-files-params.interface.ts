import { User } from "@app/shared/entities";

import { UnusedFile } from "./unused-file.interface";

export interface KeepUnusedFilesParams {
	userId: User["id"];
	unusedFiles: UnusedFile[];
}
