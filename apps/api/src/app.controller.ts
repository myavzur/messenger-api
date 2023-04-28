import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	Post,
	Req,
	UseGuards,
	UseInterceptors,
	ValidationPipe
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { LoginDto } from "apps/auth/src/dto";
import { RegisterDto } from "apps/auth/src/dto/register.dto";
import { CreateMessageDto } from "apps/chat/src/dto";

import { User } from "@app/shared/entities";
import { AuthGuard } from "@app/shared/guards";
import { UserInterceptor } from "@app/shared/interceptors";
import { UserRequest } from "@app/shared/interfaces";

@Controller()
export class AppController {
	constructor(
		@Inject("AUTH_SERVICE") private authService: ClientProxy,
		@Inject("CHAT_SERVICE") private chatService: ClientProxy,
		@Inject("PRESENCE_SERVICE") private presenceService: ClientProxy
	) {}

	// * Auth
	@Get("auth")
	async getUsers() {
		return this.authService.send({ cmd: "get-users" }, {});
	}

	@Get("auth/me")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getUser(@Req() request: UserRequest) {
		return this.authService.send({ cmd: "get-user-by-id" }, { id: request.user.id });
	}

	@Post("auth/register")
	async register(@Body(new ValidationPipe()) dto: RegisterDto) {
		return this.authService.send({ cmd: "register" }, dto);
	}

	@Post("auth/login")
	async login(@Body(new ValidationPipe()) dto: LoginDto) {
		return this.authService.send({ cmd: "login" }, dto);
	}

	// * Friend requests
	@Get("friend-requests")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getFriendRequests(@Req() request: UserRequest) {
		return this.authService.send(
			{ cmd: "get-friend-requests" },
			{ forUserId: request.user.id }
		);
	}

	@Post("friend-requests/:id")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async createFriendRequest(
		@Req() request: UserRequest,
		@Param("id") id: User["id"]
	) {
		return this.authService.send(
			{ cmd: "create-friend-request" },
			{
				fromUserId: request.user.id,
				toUserId: id
			}
		);
	}

	// * Chats
	@Get("chats")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getChats(@Req() request: UserRequest) {
		return this.chatService.send({ cmd: "get-chats" }, { userId: request.user.id });
	}

	// TODO: Remove
	@Post("chats/messages")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async createMessage(@Req() request: UserRequest, @Body() dto: CreateMessageDto) {
		return this.chatService.send(
			{ cmd: "create-message" },
			{
				userId: request.user.id,
				message: dto
			}
		);
	}
}
