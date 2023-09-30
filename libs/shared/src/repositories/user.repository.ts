import { Injectable } from "@nestjs/common";
import { DataSource, ILike } from "typeorm";

import { User } from "../entities";

import { BaseRepository } from "./base.repository.abstract";
import { IUserRepository } from "./user.repository.interface";

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
	async findUsersBasedOnLocalChats(userId: User["id"]): Promise<User[]> {
		return await this.dataSource.query(
			`
			SELECT id, account_name, avatar_url FROM users
			JOIN chats_has_users chatUsersA ON chatUsersA.user_id = users.id
			JOIN chats_has_users chatUsersB ON chatUsersA.chat_id = chatUsersB.chat_id
			WHERE chatUsersA.user_id != $1 AND chatUsersB.user_id = $1
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
