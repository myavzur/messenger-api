import { Injectable } from "@nestjs/common";
import { DataSource, ILike } from "typeorm";

import { ChatType, User } from "../entities";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	IGetUsersBasedOnLocalChatsResult,
	IUserRepository
} from "./user.repository.interface";

@Injectable()
export class UserRepository
	extends BaseRepositoryAbstract<User>
	implements IUserRepository
{
	constructor(private dataSource: DataSource) {
		super(User, dataSource.createEntityManager());
	}

	/** Returns User[] for {userId} based on local chats of {userId}.
	 * @example
	 * import React from "react";
	 *
	 * // We only want to give current user opportunity to add users with which he already talked.
	 * const usersForGroupChat = await this.userRepository
	 * 	.getUsersBasedOnLocalChats(currentUser.id);
	 *
	 * usersForGroupChat.map(user => (
	 * 	<button>"Add {user.id} to Group Chat"</button>
	 * )
	 */
	async getUsersBasedOnLocalChats(
		userId: User["id"]
	): IGetUsersBasedOnLocalChatsResult {
		return await this.dataSource.query(
			`
				SELECT
					users.id,
					users.account_name,
					users.avatar_url,
					chats.id as chat_id
				FROM users
				INNER JOIN chats_has_participants participant
					ON participant.user_id = users.id
				INNER JOIN chats_has_participants participantB
					ON participant.chat_id = participantB.chat_id
				INNER JOIN chats
					ON chats.id = participantB.chat_id
				WHERE
					participant.user_id != $1 AND
					participantB.user_id = $1 AND
					chats.type = $2
			`,
			[userId, ChatType.LOCAL]
		);
	}

	async getUsersLikeAccountName(accountName: User["account_name"]): Promise<User[]> {
		return await this.find({
			where: { account_name: ILike(`%${accountName}%`) }
		});
	}

	/** Returns User with `password` column. */
	async getUserByEmail(email: string): Promise<User> {
		return await this.findOne({
			where: { email },
			select: ["id", "email", "password", "account_name", "avatar_url"]
		});
	}
}
