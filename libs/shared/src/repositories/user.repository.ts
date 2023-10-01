import { Injectable } from "@nestjs/common";
import { DataSource, ILike } from "typeorm";

import { User } from "../entities";

import { BaseRepository } from "./base.repository.abstract";
import {
	IFindUsersBasedOnLocalChats,
	IUserRepository
} from "./user.repository.interface";

@Injectable()
export class UserRepository extends BaseRepository<User> implements IUserRepository {
	constructor(private dataSource: DataSource) {
		super(User, dataSource.createEntityManager());
	}

	/** Returns User[] for {userId} based on local chats of {userId}.
	 * @example
	 * import React from "react";
	 *
	 * // We only want to give current user opportunity to add users with which he already talked.
	 * const usersForGroupChat = await this.userRepository
	 * 	.findUsersBasedOnLocalChats(currentUser.id);
	 *
	 * usersForGroupChat.map(user => (
	 * 	<button>"Add {user.id} to Group Chat"</button>
	 * )
	 */
	async findUsersBasedOnLocalChats(userId: User["id"]): IFindUsersBasedOnLocalChats {
		return await this.dataSource.query(
			`
				SELECT
					users.id,
					users.account_name,
					users.avatar_url,
					chats.id as chat_id
				FROM users
				INNER JOIN chats_has_users cu ON cu.user_id = users.id
				INNER JOIN chats_has_users cuA ON cu.chat_id = cuA.chat_id
				INNER JOIN chats ON chats.id = cuA.chat_id
				WHERE
					cu.user_id != $1 AND
					cuA.user_id = $1 AND
					chats.is_group = false
			`,
			[userId]
		);
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
