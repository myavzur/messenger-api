import {
	Body,
	Controller,
	DefaultValuePipe,
	Get,
	Inject,
	Param,
	ParseIntPipe,
	Post,
	Query,
	Req,
	UseGuards,
	UseInterceptors,
	ValidationPipe
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { LoginDto } from "apps/auth/src/dto";
import { RegisterDto } from "apps/auth/src/dto/register.dto";
import { CreateMessageDto, PaginatedChatsDto } from "apps/chat/src/dto";
import { GetChatPayload, GetChatsPayload } from "apps/chat/src/interfaces";

import { Chat, User } from "@app/shared/entities";
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

	// * Chats
	@Get("chats")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getChats(
		@Req() request: UserRequest,
		@Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
		@Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number
	) {
		return this.chatService.send<PaginatedChatsDto, GetChatsPayload>(
			{ cmd: "get-chats" },
			{
				userId: request.user.id,
				page,
				limit
			}
		);
	}

	@Get("chats/id/:id")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getChat(@Req() request: UserRequest, @Param("id") id: Chat["id"]) {
		return this.chatService.send<Chat, GetChatPayload>(
			{ cmd: "get-chat" },
			{
				userId: request.user.id,
				chatId: id
			}
		);
	}

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
