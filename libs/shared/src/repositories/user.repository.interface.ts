import { Chat, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export type IFindUsersBasedOnLocalChats = Promise<
	{
		id: User["id"];
		account_name: User["account_name"];
		avatar_url: User["avatar_url"];
		chat_id: Chat["id"];
	}[]
>;

export interface IUserRepository extends IBaseRepository<User> {
	findUsersBasedOnLocalChats(userId: User["id"]): IFindUsersBasedOnLocalChats;
	findManyLikeAccountName(accountName: User["account_name"]): Promise<User[]>;
	findOneByEmail(email: User["email"]): Promise<User>;
}
