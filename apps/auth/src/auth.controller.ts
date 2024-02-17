import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { Attachment, User } from "@app/shared/entities";

import { AuthService } from "./auth.service";
import { GetUsersBasedOnLocalChatsDto, LoginDto, RegisterDto } from "./dto";
import { UpdateUserAvatarPayload } from "./interfaces";

// TODO: Types for RMQ!!!!
@Controller()
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	// * Users
	@MessagePattern({ cmd: "get-users-based-on-chats" })
	async getUsersBasedOnLocalChats(
		@Ctx() context: RmqContext,
		@Payload() payload: GetUsersBasedOnLocalChatsDto
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.getUsersBasedOnLocalChats(payload);
	}

	@MessagePattern({ cmd: "get-users-like-account-name" })
	async getUsersLikeAccountName(
		@Ctx() context: RmqContext,
		@Payload() payload: { account_name: User["account_name"] }
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.getUsersLikeAccountName(payload.account_name);
	}

	@MessagePattern({ cmd: "get-user-by-id" })
	async getUserById(
		@Ctx() context: RmqContext,
		@Payload() payload: { id: User["id"] }
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.getUserById(payload.id);
	}

	@MessagePattern({ cmd: "update-user-avatar" })
	async updateUserAvatar(
		@Ctx() context: RmqContext,
		@Payload()
		payload: UpdateUserAvatarPayload
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.updateUserAvatar(payload);
	}

	// * Auth
	@MessagePattern({ cmd: "register" })
	async register(@Ctx() context: RmqContext, @Payload() payload: RegisterDto) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.register(payload);
	}

	@MessagePattern({ cmd: "login" })
	async login(@Ctx() context: RmqContext, @Payload() payload: LoginDto) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.login(payload);
	}

	// * Security - Tokens
	@MessagePattern({ cmd: "verify-access-token" })
	async verifyAccessToken(
		@Ctx() context: RmqContext,
		@Payload() payload: { token: string }
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.verifyAccessToken(payload);
	}

	@MessagePattern({ cmd: "decode-access-token" })
	async decodeAccessToken(
		@Ctx() context: RmqContext,
		@Payload() payload: { token: string }
	) {
		this.rabbitmqService.acknowledgeMessage(context);
		return await this.authService.decodeAccessToken(payload);
	}
}
