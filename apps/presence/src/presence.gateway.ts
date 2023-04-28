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
import { FriendRequest, User } from "@app/shared/entities";
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

	// TODO: Remove in production (need for development)
	async onModuleInit() {
		await this.cache.reset();
		this.logger.debug("Socket cache was restarted.");
	}

	// * Connections
	async handleConnection(socket: UserSocket) {
		this.logger.debug("Connection handled.");

		const token = extractTokenFromHeaders(socket.handshake.headers);

		if (!token) {
			return socket.disconnect(true);
		}

		const ob$ = this.authService.send<UserAccessToken>(
			{ cmd: "decode-access-token" },
			{ token }
		);
		const tokenPayload = await firstValueFrom(ob$).catch(e => this.logger.error(e));

		if (!tokenPayload || !tokenPayload.user) {
			return socket.disconnect(true);
		}

		socket.data.user = tokenPayload.user;

		await this.presenceService.setConnectedUser({
			socketId: socket.id,
			userId: tokenPayload.user.id,
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
	/**
	 * Setting socket in cache || Updating it with new user status.
	 * - Fires `emitStatusToFriends` inside.
	 */
	private async changeUserStatus(socket: UserSocket, status: ConnectedUserStatus) {
		const user = socket.data?.user;

		if (!user) {
			this.logger.warn("Something goes wrong.");
			return null;
		}

		await this.emitStatusToFriends(socket.data.user.id, status);
	}

	/**
	 * Emits `friend-changed-status` for all of user's friends.
	 * Also emits `friend-changed-status` to user so he will know in what status his friends are in now.
	 */
	private async emitStatusToFriends(
		userId: User["id"],
		status: ConnectedUserStatus
	) {
		this.logger.debug("[emitStatusToFriends]: Emmiting...");

		const user = await this.presenceService.getConnectedUserById(userId);
		const friends = await this.getFriends(userId);

		for (const f of friends) {
			const friend = await this.presenceService.getConnectedUserById(f.id);

			if (!friend) continue;

			// Send event to my friends that I'm currently connected (online).
			this.server.to(friend.socketId).emit("friend-changed-status", {
				userId,
				status
			});

			/*
				Since we don't store user's statuses in users table,
				we want to get their statuses on socket initialization
				based on their socket connection.
			*/
			if (user) {
				this.server.to(user.socketId).emit("friend-changed-status", {
					userId: friend.userId,
					status: friend.status
				});
			}
		}
	}

	// * Helpers
	private async getFriends(forUserId: User["id"]) {
		const ob$ = this.authService.send<FriendRequest[]>(
			{ cmd: "get-friend-requests" },
			{ forUserId }
		);

		const friendsRequests = await firstValueFrom(ob$).catch(e =>
			this.logger.error(e)
		);

		if (!friendsRequests) return null;

		return friendsRequests.map(friendRequest => friendRequest.from_user);
	}

	// * Client events
	@SubscribeMessage("change-status")
	async changeStatus(socket: UserSocket, status: ConnectedUserStatus) {
		if (!socket.data?.user) return null;

		await this.changeUserStatus(socket, status);
	}
}
