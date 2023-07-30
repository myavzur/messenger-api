import { Expose } from "class-transformer";

import { PaginatedDto } from "@app/shared/dto";
import { Chat } from "@app/shared/entities";

export class PaginatedChatsDto extends PaginatedDto {
	@Expose()
	chats: Chat[];
}
