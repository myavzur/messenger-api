import { Chat, User } from "../entities";
import { ChatUser, ChatUserRole } from "../entities/chat-user.entity";

export interface IUpdateUsersParams {
	chatId: Chat["id"];
	userIds: User["id"][];
}

export interface IUpdateUserRoleParams {
	chatId: Chat["id"];
	userId: User["id"];
	role: ChatUserRole;
}

export interface IChatUserRepository {
	getUserChats(userId: User["id"]): Promise<ChatUser[]>;
	saveUsers(params: IUpdateUsersParams): Promise<void>;
	deleteUsers(params: IUpdateUsersParams): Promise<void>;
	updateUserRole(params: IUpdateUserRoleParams): Promise<void>;
}
