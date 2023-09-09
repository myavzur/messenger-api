import { GetChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, User } from "../entities";

export interface IChatRepository {
	findConversation(userId: User["id"], withUserId: User["id"]): Promise<Chat>;
	findChats(payload: GetChatsDto): Promise<PaginatedChatsDto>;
}
