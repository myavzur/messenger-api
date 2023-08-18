import { User } from "../entities";

import { IBaseRepository } from "./base.repository.interface";

export interface IUserRepository extends IBaseRepository<User> {
	findOneByEmail(email: User["email"]): Promise<User>;
}
