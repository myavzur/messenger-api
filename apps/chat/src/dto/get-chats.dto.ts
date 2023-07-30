import { Paginatable } from "@app/shared/dto";
import { User } from "@app/shared/entities";

export class GetChatsDto extends Paginatable {
	userId: User["id"];
}
