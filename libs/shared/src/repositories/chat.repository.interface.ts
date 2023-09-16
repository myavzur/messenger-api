import { GetAnyChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, User } from "../entities";

export interface IChatRepository {
	findLocalChats(userId: User["id"]): Promise<Chat[]>;
	findLocalChat(userId: User["id"], withUserId: User["id"]): Promise<Chat>;
	findAnyChats(payload: GetAnyChatsDto): Promise<PaginatedChatsDto>;
}
