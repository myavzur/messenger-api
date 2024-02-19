import { User } from "@app/shared/entities";

export interface GetUnusedFilesParams {
	userId: User["id"];
}
