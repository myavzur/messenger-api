import { Paginatable } from "@app/shared/dto";
import { Chat } from "@app/shared/entities";

export class GetChatHistoryDto extends Paginatable {
	chatId: Chat["id"];
}
