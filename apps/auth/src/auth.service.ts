import {
	BadRequestException,
	Injectable,
	Logger,
	UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";

import { User } from "@app/shared/entities";
import { UserAccessToken } from "@app/shared/interfaces";
import { UserRepository } from "@app/shared/repositories";

import { GetUsersBasedOnLocalChatsDto, LoginDto, RegisterDto } from "./dto";
import { comparePasswords, hashPassword } from "./helpers";
import { UpdateUserAvatarPayload } from "./interfaces";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserRepository)
		private readonly userRepository: UserRepository,
		private readonly jwtService: JwtService
	) {}

	logger: Logger = new Logger(AuthService.name);

	// * Get
	async getUsersBasedOnLocalChats(payload: GetUsersBasedOnLocalChatsDto) {
		return await this.userRepository.getUsersBasedOnLocalChats(payload.userId);
	}

	async getUsersLikeAccountName(
		account_name: User["account_name"]
	): Promise<User[]> {
		return this.userRepository.getUsersLikeAccountName(account_name);
	}

	async getUserById(id: User["id"]) {
		return this.userRepository.findOneById(id);
	}

	// * Authentication
	async register(
		payload: RegisterDto
	): Promise<{ user: User; access_token: string }> {
		if (payload.password !== payload.password_confirmation) {
			throw new BadRequestException("Passwords didn't match.");
		}

		const oldUser = await this.userRepository.getUserByEmailOrAccountName({
			email: payload.email,
			accountName: payload.account_name
		});

		if (oldUser) {
			throw new BadRequestException("An account with that email already exists.");
		}

		const hashedPassword = await hashPassword(payload.password);

		const user = await this.userRepository.save({
			email: payload.email,
			account_name: payload.account_name,
			password: hashedPassword
		});

		const accessToken = await this.generateAccessToken(user);

		delete user.password;

		return { user, access_token: accessToken };
	}

	async login(payload: LoginDto): Promise<{ user: User; access_token: string }> {
		const user = await this.userRepository.getUserByEmailOrAccountName({
			email: payload.email
		});

		this.logger.debug(JSON.stringify(user));

		if (!user) {
			throw new BadRequestException();
		}

		if (!comparePasswords(payload.password, user.password)) {
			throw new UnauthorizedException();
		}

		const accessToken = await this.generateAccessToken(user);

		delete user.password;

		return { user, access_token: accessToken };
	}

	// * Avatars
	async updateUserAvatar(payload: UpdateUserAvatarPayload) {
		const { user_id, attachment_id } = payload;

		return await this.userRepository.update(
			{ id: user_id },
			{
				avatar: {
					id: attachment_id
				}
			}
		);
	}

	// * Security - Tokens
	async generateAccessToken(user: User): Promise<string> {
		return await this.jwtService.signAsync({
			user: { id: user.id }
		} as UserAccessToken);
	}

	async verifyAccessToken({ token }: { token: string }): Promise<UserAccessToken> {
		try {
			return await this.jwtService.verifyAsync(token);
		} catch (e) {
			throw new UnauthorizedException();
		}
	}

	async decodeAccessToken({ token }: { token: string }): Promise<UserAccessToken> {
		try {
			return (await this.jwtService.decode(token)) as UserAccessToken;
		} catch (e) {
			throw new BadRequestException();
		}
	}
}
