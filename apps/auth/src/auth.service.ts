import {
	BadRequestException,
	Injectable,
	UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";

import { FriendRequest, User } from "@app/shared/entities";
import { UserAccessToken } from "@app/shared/interfaces";

import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectRepository(FriendRequest)
		private readonly friendRequestRepository: Repository<FriendRequest>,
		private readonly jwtService: JwtService
	) {}

	// * Authentication
	async register(
		payload: RegisterDto
	): Promise<{ user: User; accessToken: string }> {
		if (payload.password !== payload.passwordConfirmation) {
			throw new BadRequestException("Passwords didn't match.");
		}

		const oldUser = await this.findByEmail(payload.email);

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

		return { user, accessToken: accessToken };
	}

	async login(payload: LoginDto): Promise<{ user: User; accessToken: string }> {
		const user = await this.findByEmail(payload.email);

		if (!user) {
			throw new BadRequestException();
		}

		if (!this.comparePasswords(payload.password, user.password)) {
			throw new UnauthorizedException();
		}

		const accessToken = await this.generateAccessToken(user);

		delete user.password;

		return { user, accessToken: accessToken };
	}

	// * Friend requests
	async createFriendRequest(payload: {
		fromUserId: User["id"];
		toUserId: User["id"];
	}) {
		const toUser = await this.findById(payload.toUserId);

		if (!toUser) {
			throw new BadRequestException();
		}

		const friendRequest = await this.friendRequestRepository.findOne({
			where: [
				{ from_user: { id: payload.fromUserId } },
				{ to_user: { id: payload.toUserId } }
			]
		});

		if (friendRequest) {
			throw new BadRequestException();
		}

		return await this.friendRequestRepository.save({
			from_user: { id: payload.fromUserId },
			to_user: { id: payload.toUserId }
		});
	}

	async getFriendRequests(payload: { forUserId: User["id"] }) {
		return await this.friendRequestRepository.find({
			where: {
				to_user: { id: payload.forUserId }
			},
			relations: {
				from_user: true
			}
		});
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
		// TODO: Типизировать токен
		return await this.jwtService.signAsync({
			user: {
				id: user.id
			}
		});
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

	// * Helpers
	async findUsers(): Promise<User[]> {
		return await this.userRepository.find();
	}

	/** Returns User with `password` column. */
	async findByEmail(email: User["email"]): Promise<User> {
		return await this.userRepository.findOne({
			where: { email },
			select: ["id", "account_name", "first_name", "last_name", "password"]
		});
	}

	async findById(id: User["id"]): Promise<User> {
		return await this.userRepository.findOne({
			where: { id }
		});
	}
}
