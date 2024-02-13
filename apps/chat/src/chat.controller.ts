import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { Chat, User } from "@app/shared/entities";

import { ChatService } from "./chat.service";
import { CreateGroupChatDto, CreateMessageDto, PaginatedChatsDto } from "./dto";
import { GetChatDto, GetUserChatsDto } from "./dto";

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
