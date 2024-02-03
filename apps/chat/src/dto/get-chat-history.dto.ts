import { Pagination } from "@app/shared/dto";
import { Chat } from "@app/shared/entities";

export class GetChatHistoryDto extends Pagination {
	chatId: Chat["id"];
}
