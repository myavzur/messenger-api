import { Request } from "express";
import { Handshake } from "socket.io/dist/socket";

export const extractTokenFromHeaders = (
	headers: Request["headers"] | Handshake["headers"]
): string | undefined => {
	const [type, token] = headers.authorization?.split(" ") || [];
	return type === "Bearer" ? token : null;
};
