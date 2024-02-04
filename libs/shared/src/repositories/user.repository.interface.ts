import { Chat, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface IGetUsersBasedOnLocalChatsRow {
	id: User["id"];
	account_name: User["account_name"];
	avatar_url: User["avatar_url"];
	chat_id: Chat["id"];
}

export interface IGetUserByEmailOrAccountNameParams {
	email: User["email"];
	accountName?: User["account_name"];
}

export interface IUserRepository extends IBaseRepository<User> {
	getUsersBasedOnLocalChats(
		userId: User["id"]
	): Promise<IGetUsersBasedOnLocalChatsRow[]>;
	getUsersLikeAccountName(account_name: User["account_name"]): Promise<User[]>;
	getUserByEmailOrAccountName(
		params: IGetUserByEmailOrAccountNameParams
	): Promise<User>;
}
