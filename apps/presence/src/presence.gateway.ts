import { Inject, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from "@nestjs/websockets";
import { firstValueFrom } from "rxjs";
import { Server } from "socket.io";

import { Chat, User } from "@app/shared/entities";
import { extractTokenFromHeaders } from "@app/shared/helpers";
import { UserAccessToken, UserSocket } from "@app/shared/interfaces";

import { ConnectedUserStatus } from "./interfaces";
import { PresenceService } from "./presence.service";

@WebSocketGateway({ cors: true })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		@Inject("CHAT_SERVICE")
		private readonly chatService: ClientProxy,
		private readonly presenceService: PresenceService
	) {}

	@WebSocketServer()
	server: Server;
	logger: Logger = new Logger(PresenceGateway.name);

	async onModuleInit() {
		await this.presenceService.clearConnectedUsers();
	}

	// * Connections
	async handleConnection(socket: UserSocket) {
		this.logger.debug("[handleConnection]: Connection handled.");

		const token = extractTokenFromHeaders(socket.handshake.headers);

		if (!token) {
			return socket.disconnect(true);
		}

		const decodedToken$ = this.authService.send<UserAccessToken>(
			{ cmd: "decode-access-token" },
			{ token }
		);
		const decodedToken = await firstValueFrom(decodedToken$).catch(e =>
			this.logger.error(e)
		);

		if (!decodedToken || !decodedToken.user) {
			return socket.disconnect(true);
		}

		socket.data.user = decodedToken.user;

		await this.presenceService.setConnectedUser({
			socketId: socket.id,
			userId: decodedToken.user.id,
			status: ConnectedUserStatus.ONLINE
		});

		await this.emitStatus(decodedToken.user.id, ConnectedUserStatus.ONLINE);
	}

	async handleDisconnect(socket: UserSocket) {
		this.logger.debug("[handleDisconnect]: Disconnect handled.");
		const user = socket.data?.user;

		if (user) {
			await this.presenceService.deleteConnectedUserById(user.id);
			await this.emitStatus(user.id, ConnectedUserStatus.INVISIBLE);
		}
	}

	// * Statuses
	/** Emits `new-status` for all user's local chats. */
	private async emitStatus(userId: User["id"], status: ConnectedUserStatus) {
		this.logger.debug("[emitStatus]: Emitting...");

		const localChats$ = this.chatService.send<Chat[]>(
			{ cmd: "get-local-chats" },
			{ userId }
		);
		const localChats = await firstValueFrom(localChats$).catch(e =>
			this.logger.error(e)
		);

		if (localChats) {
			localChats.forEach(async chat => {
				const connectedUser = await this.presenceService.getConnectedUserById(
					chat.users[0].id
				);
				if (!connectedUser) return;

				console.log(connectedUser);

				this.server.to(connectedUser.socketId).emit("new-status-in-local-chat", {
					chatId: chat.id,
					userId,
					status
				});
			});
		}
	}

	// * Client events
	@SubscribeMessage("change-status")
	async changeStatus(socket: UserSocket, status: ConnectedUserStatus) {
		const user = socket.data?.user;

		if (!user) {
			this.logger.error("[changeStatus]: Socket has no user data.");
		}

		await this.emitStatus(user.id, status);
	}

	// @SubscribeMessage("get-statuses")
	// async getStatuses(socket: UserSocket, payload: GetUserStatusDto) {
	// 	const connectedUser = await this.presenceService.getConnectedUserById(
	// 		payload.userId
	// 	);

	// 	if (!connectedUser) return;

	// 	socket.emit("new-status", {
	// 		userId: payload.userId,
	// 		status: connectedUser.status
	// 	});
	// }
}
