import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	Post,
	Query,
	Req,
	UseGuards,
	UseInterceptors,
	ValidationPipe
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { LoginDto, RegisterDto } from "apps/auth/src/dto";

import { User } from "@app/shared/entities";
import { AuthGuard } from "@app/shared/guards";
import { UserInterceptor } from "@app/shared/interceptors";
import { UserRequest } from "@app/shared/interfaces";
import { GetUsersBasedOnLocalChatsRow } from "@app/shared/repositories/user.repository.interface";

@Controller()
export class AppController {
	constructor(
		@Inject("AUTH_SERVICE") private authService: ClientProxy,
		@Inject("UPLOADS_SERVICE") private uploadsService: ClientProxy
	) {}

	// Users
	@Get("users")
	async getUsers() {
		return this.authService.send<User[]>({ cmd: "get-users" }, {});
	}

	@Get("users/search")
	async getUsersLikeAccountName(
		@Query("account_name") account_name: User["account_name"]
	) {
		return this.authService.send<User[], User["account_name"]>(
			{ cmd: "get-users-like-account-name" },
			account_name
		);
	}

	@Get("users/:id/avatars")
	async getUserAvatars(@Param("id") id: User["id"]) {
		return this.uploadsService.send<File[], User["id"]>({ cmd: "get-avatars" }, id);
	}

	@Get("users/local-chats")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getUsersBasedOnLocalChats(@Req() request: UserRequest) {
		return this.authService.send<GetUsersBasedOnLocalChatsRow[], User["id"]>(
			{ cmd: "get-users-based-on-chats" },
			request.user.id
		);
	}

	// Auth
	@Get("auth/me")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getUser(@Req() request: UserRequest) {
		return this.authService.send<User, User["id"]>(
			{ cmd: "get-user-by-id" },
			request.user.id
		);
	}

	@Post("auth/register")
	async register(@Body(new ValidationPipe()) dto: RegisterDto) {
		return this.authService.send<User, RegisterDto>({ cmd: "register" }, dto);
	}

	@Post("auth/login")
	async login(@Body(new ValidationPipe()) dto: LoginDto) {
		return this.authService.send<User, LoginDto>({ cmd: "login" }, dto);
	}
}
