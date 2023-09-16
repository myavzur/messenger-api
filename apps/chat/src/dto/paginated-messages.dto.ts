import { Expose } from "class-transformer";

import { Paginated } from "@app/shared/dto";
import { Message } from "@app/shared/entities";

export class PaginatedMessagesDto extends Paginated {
	@Expose()
	messages: Message[];
}
