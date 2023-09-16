import { Pagination } from "@app/shared/dto";
import { User } from "@app/shared/entities";

export class GetAnyChatsDto extends Pagination {
	userId: User["id"];
}
