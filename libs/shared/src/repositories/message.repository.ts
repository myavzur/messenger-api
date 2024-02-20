import { Injectable, Logger } from "@nestjs/common";
import { DataSource, FindOptionsWhere, In } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

import { ChatParticipantRole, ChatType, Message } from "../entities";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	CreateMessagePayload,
	DeleteMessagesPayload,
	GetMessagePayload,
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

	async getMessage(payload: GetMessagePayload): Promise<Message> {
		return await this.findOne({
			where: {
				id: payload.messageId,
				chat: {
					id: payload.chatId
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
	async createMessage(payload: CreateMessagePayload): Promise<Message["id"]> {
		const messageConfig: QueryDeepPartialEntity<Message> = {
			user: { id: payload.creatorId },
			chat: { id: payload.chatId }
		};

		if (payload.replyForId) {
			messageConfig.reply_for = { id: payload.replyForId };
		}

		if (payload.text) {
			messageConfig.text = payload.text.trim();
		}

		return (await this.insert(messageConfig)).identifiers[0].id;
	}

	/** Deletes MANY messages from ONE chat at time.
	 * @returns deletedMessageIDs;
	 */
	async deleteMessages(payload: DeleteMessagesPayload): Promise<Message["id"][]> {
		const { chatId, chatType, removerId, removerChatRole, messageIds } = payload;

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
