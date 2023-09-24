import { GetAnyChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, User } from "../entities";

export interface IChatRepository {
	findLocalChat(userIds: User["id"][]): Promise<Chat>;
	findLocalChats(userId: User["id"]): Promise<Chat[]>;
	findAnyChats(payload: GetAnyChatsDto): Promise<PaginatedChatsDto>;
}
