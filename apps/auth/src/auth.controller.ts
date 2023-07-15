import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { User } from "@app/shared/entities";

import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

@Controller()
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	@MessagePattern({ cmd: "get-user-by-id" })
	async getUserById(
		@Ctx() context: RmqContext,
		@Payload() payload: { id: User["id"] }
	) {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.authService.findById(payload.id);
	}

	@MessagePattern({ cmd: "get-users" })
	async getUsers(@Ctx() context: RmqContext) {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.authService.findUsers();
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
