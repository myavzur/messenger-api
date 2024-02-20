import { Injectable } from "@nestjs/common";
import { DataSource, ILike } from "typeorm";

import { ChatType, User } from "../entities";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	GetUserByEmailOrAccountNamePayload,
	GetUsersBasedOnLocalChatsRow,
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

	/** Retrieves users based on local chats of `userId`.
	 *
	 * @param {User["id"]} userId - The ID of the user
	 * @return {Promise<User[]>} The users based on local chats of `userId`
	 */
	async getUsersBasedOnLocalChats(
		payload: User["id"]
	): Promise<GetUsersBasedOnLocalChatsRow[]> {
		return await this.dataSource.query(
			`
				SELECT
					users.id,
					users.account_name,
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
			[payload, ChatType.LOCAL]
		);
	}

	async getUsersLikeAccountName(payload: User["account_name"]): Promise<User[]> {
		return await this.find({
			where: { account_name: ILike(`%${payload}%`) }
		});
	}

	/** Returns User with `password` and `email` column. */
	async getUserByEmailOrAccountName(
		payload: GetUserByEmailOrAccountNamePayload
	): Promise<User> {
		const { email, accountName } = payload;

		return await this.findOne({
			where: [{ email }, { account_name: accountName }],
			select: ["id", "email", "password", "account_name"]
		});
	}
}
