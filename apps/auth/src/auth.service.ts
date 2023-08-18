import {
	BadRequestException,
	Injectable,
	UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";

import { User } from "@app/shared/entities";
import { UserAccessToken } from "@app/shared/interfaces";
import { UserRepository } from "@app/shared/repositories";

import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserRepository)
		private readonly userRepository: UserRepository,
		private readonly jwtService: JwtService
	) {}

	// * Users
	async getUsers() {
		return await this.userRepository.findAll();
	}

	async getUsersLikeAccountName(
		account_name: User["account_name"]
	): Promise<User[]> {
		return this.userRepository.findManyLikeAccountName(account_name);
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

		const oldUser = await this.userRepository.findOneByEmail(payload.email);

		if (oldUser) {
			throw new BadRequestException("An account with that email already exists.");
		}

		const hashedPassword = await this.hashPassword(payload.password);

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
		const user = await this.userRepository.findOneByEmail(payload.email);

		if (!user) {
			throw new BadRequestException();
		}

		if (!this.comparePasswords(payload.password, user.password)) {
			throw new UnauthorizedException();
		}

		const accessToken = await this.generateAccessToken(user);

		delete user.password;

		return { user, access_token: accessToken };
	}

	// * Security - Passwords
	async hashPassword(password: string): Promise<string> {
		return await bcrypt.hash(password, 12);
	}

	async comparePasswords(
		password: string,
		hashedPassword: string
	): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
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
