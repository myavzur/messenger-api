import { Expose } from "class-transformer";

import { PaginatedDto } from "@app/shared/dto";
import { Message } from "@app/shared/entities";

export class PaginatedMessagesDto extends PaginatedDto {
	@Expose()
	messages: Message[];
}
