import { User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface IUserRepository extends IBaseRepository<User> {
	findUsersBasedOnLocalChats(userId: User["id"]): Promise<User[]>;
	findManyLikeAccountName(accountName: User["account_name"]): Promise<User[]>;
	findOneByEmail(email: User["email"]): Promise<User>;
}
