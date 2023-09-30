import {
	Body,
	Controller,
	Get,
	Inject,
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

import { User } from "@app/shared/entities";
import { AuthGuard } from "@app/shared/guards";
import { UserInterceptor } from "@app/shared/interceptors";
import { UserRequest } from "@app/shared/interfaces";

@Controller()
export class AppController {
	constructor(@Inject("AUTH_SERVICE") private authService: ClientProxy) {}

	// * Users
	@Get("users")
	async getUsers() {
		return this.authService.send({ cmd: "get-users" }, {});
	}

	@Get("users/search")
	async getUsersLikeAccountName(
		@Query("account_name") account_name: User["account_name"]
	) {
		return this.authService.send(
			{ cmd: "get-users-like-account-name" },
			{ account_name }
		);
	}

	@Get("users/local-chats")
	@UseGuards(AuthGuard)
	@UseInterceptors(UserInterceptor)
	async getUsersBasedOnLocalChats(@Req() request: UserRequest) {
		return this.authService.send(
			{ cmd: "get-users-based-on-chats" },
			{ userId: request.user.id }
		);
	}

	// * Auth
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
}
