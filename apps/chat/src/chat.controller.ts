import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { Chat, User } from "@app/shared/entities";

import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto";

@Controller()
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	@MessagePattern({ cmd: "get-chats" })
	async getChatsByUserId(
		@Ctx() context: RmqContext,
		@Payload() payload: { userId: User["id"] }
	): Promise<Chat[]> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.getChats(payload.userId);
	}

	@MessagePattern({ cmd: "create-message" })
	async createMessage(
		@Ctx() context: RmqContext,
		@Payload() payload: { userId: User["id"]; message: CreateMessageDto }
	) {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.createMessage(payload.userId, payload.message);
	}
}
