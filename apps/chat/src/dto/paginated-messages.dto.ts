import { PaginatedDto } from "@app/shared/dto";
import { Message } from "@app/shared/entities";
import { Expose } from "class-transformer";

export class PaginatedMessagesDto extends PaginatedDto {
	@Expose()
	messages: Message[];
}