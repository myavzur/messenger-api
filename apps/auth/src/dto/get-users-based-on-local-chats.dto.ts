import { User } from "@app/shared/entities";

export class GetUsersBasedOnLocalChatsDto {
	userId: User["id"];
}
