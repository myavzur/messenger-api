import { User } from "@app/shared/entities";

export class GetUserStatusDto {
	userId: User["id"];
}
