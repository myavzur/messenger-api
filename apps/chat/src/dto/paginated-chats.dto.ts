import { Expose } from "class-transformer";

import { PaginatedItemsDto } from "@app/shared/dto";
import { Chat } from "@app/shared/entities";

export class PaginatedChatsDto extends PaginatedItemsDto {
	@Expose()
	chats: Chat[];
}
