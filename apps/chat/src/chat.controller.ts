import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { Chat } from "@app/shared/entities";

import { GetUserChatsDto } from "./dto";
import { ChatService } from "./services";

@Controller()
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	@MessagePattern({ cmd: "get-local-chats" })
	async getUserLocalChats(
		@Ctx() context: RmqContext,
		@Payload() payload: GetUserChatsDto
	): Promise<Chat[]> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.getUserLocalChats(payload.userId);
	}
}
