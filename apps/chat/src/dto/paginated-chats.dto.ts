import { Expose } from "class-transformer";

import { Paginated } from "@app/shared/dto";
import { Chat } from "@app/shared/entities";

export class PaginatedChatsDto extends Paginated {
	@Expose()
	chats: Chat[];
}
