import { PaginatedItemsDto } from "@app/shared/dto";
import { Chat } from "@app/shared/entities";
import { Expose } from "class-transformer";

export class PaginatedChatsDto extends PaginatedItemsDto {
	@Expose()
	chats: Chat[];
};