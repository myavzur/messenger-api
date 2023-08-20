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
		private readonly presenceService: PresenceService,
		@Inject("AUTH_SERVICE") private readonly authService: ClientProxy,
		private readonly cache: RedisService
	) {}

	@WebSocketServer()
	server: Server;
	logger: Logger = new Logger(PresenceGateway.name);

	async onModuleInit() {
		await this.cache.reset();
		this.logger.debug("Presence cache was reset.");
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
		const decodedToken = await firstValueFrom(decodedToken$).catch(e => this.logger.error(e));

		if (!decodedToken || !decodedToken.user) {
			return socket.disconnect(true);
		}

		socket.data.user = decodedToken.user;

		await this.presenceService.setConnectedUser({
			socketId: socket.id,
			userId: decodedToken.user.id,
			status: ConnectedUserStatus.ONLINE
		});

		await this.changeUserStatus(socket, ConnectedUserStatus.ONLINE);
	}

	async handleDisconnect(socket: UserSocket) {
		this.logger.debug("[handleDisconnect]: Disconnect handled.");

		if (socket.data?.user) {
			this.logger.debug("[handleDisconnect]: Deleting connection from cache.");
			await this.presenceService.deleteConnectedUserById(socket.data.user.id);
			await this.changeUserStatus(socket, ConnectedUserStatus.INVISIBLE);
		}
	}

	// * Statuses
	private async changeUserStatus(socket: UserSocket, status: ConnectedUserStatus) {
		const user = socket.data?.user;

		if (!user) {
			this.logger.warn("Something goes wrong.");
			return null;
		}

		await this.emitStatusToUserChats(socket.data.user.id, status);
	}

	/** Emits `user-changed-status` for all chats where userId consists of. */
	private async emitStatusToUserChats(
		userId: User["id"],
		status: ConnectedUserStatus
	) {
		this.logger.debug("[emitStatusToUserChats]: Emitting...");

		const user = await this.presenceService.getConnectedUserById(userId);
		const userChats = await this.getUserChats(userId);

		this.logger.debug(userChats);
	}

	// * Helpers
	private async getUserChats(userId: User["id"]) {
		return 1;
	}

	// * Client events
	@SubscribeMessage("change-status")
	async changeStatus(socket: UserSocket, status: ConnectedUserStatus) {
		if (!socket.data?.user) return null;

		await this.changeUserStatus(socket, status);
	}
}
