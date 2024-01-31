import { Chat, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export type IGetUsersBasedOnLocalChatsResult = Promise<
	{
		id: User["id"];
		account_name: User["account_name"];
		avatar_url: User["avatar_url"];
		chat_id: Chat["id"];
	}[]
>;

export interface IUserRepository extends IBaseRepository<User> {
	getUsersBasedOnLocalChats(userId: User["id"]): IGetUsersBasedOnLocalChatsResult;
	getUsersLikeAccountName(accountName: User["account_name"]): Promise<User[]>;
	getUserByEmail(email: User["email"]): Promise<User>;
}
