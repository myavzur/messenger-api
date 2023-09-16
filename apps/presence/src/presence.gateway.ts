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

import { RedisService } from "@app/redis";
import { User } from "@app/shared/entities";
import { extractTokenFromHeaders } from "@app/shared/helpers";
import { UserAccessToken, UserSocket } from "@app/shared/interfaces";

import { ConnectedUserStatus } from "./interfaces";
import { PresenceService } from "./presence.service";

@WebSocketGateway({ cors: true })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		@Inject("AUTH_SERVICE")
		private readonly chatService: ClientProxy,
		private readonly presenceService: PresenceService,
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
	/** Emits `user-changed-status` for all user's conversations. */
	private async emitStatus(
		userId: User["id"],
		status: ConnectedUserStatus
	) {
		this.logger.debug("[emitStatus]: Emitting...");

		const user = await this.presenceService.getConnectedUserById(userId);
		const conversations = await this.getUserChats(userId);

		this.logger.debug(userChats);
	}

	// * Client events
	@SubscribeMessage("change-status")
	async changeStatus(socket: UserSocket, status: ConnectedUserStatus) {
		const user = socket.data?.user;

		if (!user) {
			this.logger.error('[changeStatus]: Socket has no user data.');
		};

		await this.emitStatus(user.id, status);
	}
}
