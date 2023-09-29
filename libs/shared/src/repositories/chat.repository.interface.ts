import { GetAnyChatsDto, PaginatedChatsDto } from "apps/chat/src/dto";

import { Chat, User } from "../entities";

export interface IChatRepository {
	findUsersBasedOnLocalChats(userId: User["id"]): Promise<User[]>;
	findLocalChat(userIds: User["id"][]): Promise<Chat>;
	findAnyChats(payload: GetAnyChatsDto): Promise<PaginatedChatsDto>;
}
