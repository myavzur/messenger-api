import { User } from "@app/shared/entities";
import { UserAccessToken } from "@app/shared/interfaces";
import { GetUsersBasedOnLocalChatsRow } from "@app/shared/repositories/user.repository.interface";

import { LoginDto, RegisterDto } from "./dto";

export interface AuthResult {
	user: User;
	access_token: string;
}

// Payloads
export interface UpdateAvatarPayload {
	user_id: string;
	file_id: string;
}

export interface IAuthService {
	getUserById(payload: User["id"]): Promise<User>;
	getUsersLikeAccountName(payload: User["account_name"]): Promise<User[]>;
	getUsersBasedOnLocalChats(
		payload: User["id"]
	): Promise<GetUsersBasedOnLocalChatsRow[]>;

	generateAccessToken(payload: User): Promise<string>;
	verifyAccessToken(payload: string): Promise<UserAccessToken>;
	decodeAccessToken(payload: string): Promise<UserAccessToken>;

	register(payload: RegisterDto): Promise<AuthResult>;
	login(payload: LoginDto): Promise<AuthResult>;

	updateUserAvatar(payload: UpdateAvatarPayload): Promise<void>;
}
