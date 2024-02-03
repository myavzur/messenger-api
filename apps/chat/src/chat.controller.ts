import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { Chat, User } from "@app/shared/entities";

import { ChatService } from "./chat.service";
import { CreateGroupChatDto, CreateMessageDto, PaginatedChatsDto } from "./dto";
import { GetAnyChatDto, GetUserChatsDto } from "./dto";

@Controller()
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	@MessagePattern({ cmd: "get-local-chats" })
	async getLocalChats(
		@Ctx() context: RmqContext,
		@Payload() payload: GetUserChatsDto
	): Promise<Chat[]> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.getLocalChats(payload.userId);
	}

	@MessagePattern({ cmd: "get-chats" })
	async getAllChat(
		@Ctx() context: RmqContext,
		@Payload() payload: GetUserChatsDto
	): Promise<PaginatedChatsDto> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.getUserChats(payload);
	}

	@MessagePattern({ cmd: "get-chat" })
	async getChat(
		@Ctx() context: RmqContext,
		@Payload() payload: GetAnyChatDto
	): Promise<Chat> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.getChat(payload);
	}

	@MessagePattern({ cmd: "create-group-chat" })
	async createGroupChat(
		@Ctx() context: RmqContext,
		@Payload() payload: CreateGroupChatDto
	) {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.chatService.createGroupChat(payload);
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
