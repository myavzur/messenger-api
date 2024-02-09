import { Injectable, Logger } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

import { Message } from "../entities";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	ICreateMessageParams,
	IDeleteMessagesParams,
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

	async createMessage(params: ICreateMessageParams): Promise<Message> {
		const messageConfig: QueryDeepPartialEntity<Message> = {
			user: { id: params.creatorId },
			chat: params.chat,
			text: params.text
		};

		if (params.replyForId) {
			messageConfig.reply_for = { id: params.replyForId };
		}

		const message = (await this.insert(messageConfig)).identifiers[0];

		return await this.findOne({
			where: { id: message.id },
			relations: {
				reply_for: {
					user: true
				},
				user: true
			}
		});
	}

	async deleteMessages(params: IDeleteMessagesParams): Promise<Message[]> {
		const messages = await this.find({
			where: {
				user: { id: params.removerId },
				id: In(params.messageIds)
			}
		});

		return await this.remove(messages);
	}
}
