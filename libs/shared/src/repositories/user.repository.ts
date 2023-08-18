import { Injectable } from "@nestjs/common";
import { DataSource, ILike } from "typeorm";

import { User } from "../entities";

import { BaseRepository } from "./base.repository.abstract";
import { IUserRepository } from "./user.repository.interface";

@Injectable()
export class UserRepository
	extends BaseRepository<User>
	implements IUserRepository
{
	constructor(private dataSource: DataSource) {
		super(User, dataSource.createEntityManager());
	}

	async findManyLikeAccountName(accountName: User["account_name"]): Promise<User[]> {
		return await this.find({
			where: { account_name: ILike(`%${accountName}%`) }
		});
	}

	/** Returns User with `password` column. */
	async findOneByEmail(email: string): Promise<User> {
		return await this.findOne({
			where: { email },
			select: ["id", "email", "password", "account_name", "avatar_url"]
		});
	}
}
