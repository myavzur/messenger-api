import { Pagination } from "@app/shared/dto";
import { User } from "@app/shared/entities";

export class GetUserChatsDto extends Pagination {
	userId: User["id"];
}
