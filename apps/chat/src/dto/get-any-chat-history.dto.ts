import { Pagination } from "@app/shared/dto";
import { Chat } from "@app/shared/entities";

export class GetAnyChatHistoryDto extends Pagination {
	chatId: Chat["id"];
}
