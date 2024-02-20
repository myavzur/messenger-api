import { UserRequest } from "@app/shared/interfaces";

export interface UserAccessToken extends Pick<UserRequest, "user"> {
	/** Initialized at */
	iat: number;
	/** Expires at */
	exp: number;
}
