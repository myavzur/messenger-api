import { Chat, User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface GetUsersBasedOnLocalChatsRow {
	id: User["id"];
	account_name: User["account_name"];
	avatar: User["avatar"];
	chat_id: Chat["id"];
}

export interface GetUserByEmailOrAccountNamePayload {
	email: User["email"];
	accountName?: User["account_name"];
}

export interface IUserRepository extends IBaseRepository<User> {
	getUsersBasedOnLocalChats(
		payload: User["id"]
	): Promise<GetUsersBasedOnLocalChatsRow[]>;
	getUsersLikeAccountName(payload: User["account_name"]): Promise<User[]>;
	getUserByEmailOrAccountName(
		payload: GetUserByEmailOrAccountNamePayload
	): Promise<User>;
}
