import { Injectable, Logger } from "@nestjs/common";
import { DataSource, In } from "typeorm";

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
		const message = await this.save({
			user: { id: params.creatorId },
			text: params.text,
			chat: params.chat
		});

		return await this.findOne({
			where: { id: message.id },
			relations: { user: true }
		});
	}

	async deleteMessages(params: IDeleteMessagesParams): Promise<void> {
		const messages = await this.find({
			where: {
				user: { id: params.removerId },
				id: In(params.messageIds)
			}
		});

		await this.remove(messages);
	}
}
