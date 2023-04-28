import { Socket } from "socket.io";

import { User } from "../entities";

export interface UserSocket extends Socket {
	data: {
		user: Pick<User, "id">;
	};
}
