import { UserRequest } from "./user-request.interface";

export interface UserAccessToken extends Pick<UserRequest, "user"> {
	/** Initialized at */
	iat: number;
	/** Expires at */
	exp: number;
}
