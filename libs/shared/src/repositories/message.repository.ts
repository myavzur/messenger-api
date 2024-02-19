import { Injectable, Logger } from "@nestjs/common";
import { DataSource, FindOptionsWhere, In } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

import { ChatParticipantRole, ChatType, Message } from "../entities";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	ICreateMessageParams,
	IDeleteMessagesParams,
	IGetMessageParams,
	IMessageRepository
} from "./message.repository.interface";

@Injectable()
export class MessageRepository
	extends BaseRepositoryAbstract<Message>
	implements IMessageRepository
{
	constructor(private dataSource: DataSource) {
		super(Message, dataSource.createEntityManager());
	}

	logger: Logger = new Logger(MessageRepository.name);

	async getMessage(params: IGetMessageParams): Promise<Message> {
		return await this.findOne({
			where: {
				id: params.messageId,
				chat: {
					id: params.chatId
				}
			},
			relations: {
				reply_for: {
					user: true
				}
			}
		});
	}

	/** Simply creates new message.
	 * @returns message - Message with `reply_for` and `user` relations.
	 */
	async createMessage({
		chatId,
		creatorId,
		text,
		replyForId
	}: ICreateMessageParams): Promise<Message["id"]> {
		const messageConfig: QueryDeepPartialEntity<Message> = {
			user: { id: creatorId },
			chat: { id: chatId },
			text: text.trim()
		};

		if (replyForId) {
			messageConfig.reply_for = { id: replyForId };
		}

		return (await this.insert(messageConfig)).identifiers[0].id;
	}

	/** Deletes MANY messages from ONE chat at time.
	 * @returns deletedMessageIDs;
	 */
	async deleteMessages(params: IDeleteMessagesParams): Promise<Message["id"][]> {
		const { chatId, chatType, removerId, removerChatRole, messageIds } = params;

		const findWhereOptions: FindOptionsWhere<Message> = {
			chat: { id: chatId },
			id: In(messageIds)
		};

		/* Participants can delete only their messages.
		 * Although this rule rightfully only for group Chat.
		 * Because in local Chat any User can delete any Message */
		if (
			chatType === ChatType.GROUP &&
			removerChatRole === ChatParticipantRole.PARTICIPANT
		) {
			findWhereOptions.user = { id: removerId };
		}

		const messages = await this.find({
			where: findWhereOptions
		});

		// Return only deleted message IDs.
		const goneMessageIds = messages.reduce((acc, message) => {
			acc.push(message.id);
			return acc;
		}, []);

		await this.remove(messages);
		return goneMessageIds;
	}
}
