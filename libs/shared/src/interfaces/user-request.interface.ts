import { Request } from "express";

import { User } from "@app/shared/entities";

export interface UserRequest extends Request {
	user?: Pick<User, "id">;
}
