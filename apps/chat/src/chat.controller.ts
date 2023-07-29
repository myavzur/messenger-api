import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { Chat, User } from "@app/shared/entities";

import { ChatService } from "./chat.service";
import { CreateMessageDto, PaginatedChatsDto } from "./dto";
import { GetChatPayload, GetChatsPayload } from "./interfaces";

@Controller()
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	@MessagePattern({ cmd: "get-chats" })
	async getChats(
		@Ctx() context: RmqContext,
		@Payload() payload: GetChatsPayload
	): Promise<PaginatedChatsDto> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.findChats(payload);
	}

	@MessagePattern({ cmd: "get-chat" })
	async getChat(
		@Ctx() context: RmqContext,
		@Payload() payload: GetChatPayload
	): Promise<Chat> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.getChat(payload);
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
