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
import { GetUsersBasedOnLocalChatsRow } from "@app/shared/repositories/user.repository.interface";

import {
	AuthResult,
	IAuthService,
	UpdateAvatarPayload
} from "./auth.service.interface";
import { LoginDto, RegisterDto } from "./dto";
import { comparePasswords, hashPassword } from "./helpers";

@Injectable()
export class AuthService implements IAuthService {
	constructor(
		@InjectRepository(UserRepository)
		private readonly userRepository: UserRepository,
		private readonly jwtService: JwtService
	) {}

	logger: Logger = new Logger(AuthService.name);

	async getUserById(payload: User["id"]) {
		return this.userRepository.findOneById(payload);
	}

	async getUsersLikeAccountName(payload: User["account_name"]): Promise<User[]> {
		return this.userRepository.getUsersLikeAccountName(payload);
	}

	async getUsersBasedOnLocalChats(
		payload: User["id"]
	): Promise<GetUsersBasedOnLocalChatsRow[]> {
		return await this.userRepository.getUsersBasedOnLocalChats(payload);
	}

	// * Tokens
	async generateAccessToken(payload: User): Promise<string> {
		return await this.jwtService.signAsync({
			user: { id: payload.id }
		} as UserAccessToken);
	}

	async verifyAccessToken(payload: string): Promise<UserAccessToken> {
		try {
			return await this.jwtService.verifyAsync(payload);
		} catch (e) {
			throw new UnauthorizedException();
		}
	}

	async decodeAccessToken(payload: string): Promise<UserAccessToken> {
		try {
			return (await this.jwtService.decode(payload)) as UserAccessToken;
		} catch (e) {
			throw new BadRequestException();
		}
	}

	// * Authentication
	async register(payload: RegisterDto): Promise<AuthResult> {
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

	async login(payload: LoginDto): Promise<AuthResult> {
		const user = await this.userRepository.getUserByEmailOrAccountName({
			email: payload.email
		});

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
	async updateUserAvatar(payload: UpdateAvatarPayload): Promise<void> {
		const { user_id, file_id } = payload;

		await this.userRepository.update(
			{ id: user_id },
			{
				avatar: {
					id: file_id
				}
			}
		);
	}
}
