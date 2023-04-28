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

import { ConnectedUser, ConnectedUserStatus } from "./interfaces";

@WebSocketGateway({ cors: true })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
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
			this.handleDisconnect(socket);
			return null;
		}

		const ob$ = this.authService.send<UserAccessToken>(
			{ cmd: "decode-access-token" },
			{ token }
		);
		const decodedToken = await firstValueFrom(ob$).catch(e => this.logger.error(e));

		if (!decodedToken || !decodedToken.user) {
			this.handleDisconnect(socket);
			return null;
		}

		socket.data.user = decodedToken.user;

		await this.changeUserStatus(socket, ConnectedUserStatus.ONLINE);
	}

	async handleDisconnect(socket: UserSocket) {
		this.logger.debug("Disconnect handled.");

		await this.changeUserStatus(socket, ConnectedUserStatus.OFFLINE);
	}

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

		const connectedUser: ConnectedUser = {
			id: user.id,
			socketId: socket.id,
			status: status
		};

		await this.cache.set(`user ${user.id}`, connectedUser, 0);
		await this.emitStatusToFriends(connectedUser);
	}

	/**
	 * Emits `friend-changed-status` for all of user's friends.
	 * Also emits `friend-changed-status` to user so he will know in what status his friends are in now.
	 */
	private async emitStatusToFriends(connectedUser: ConnectedUser) {
		const friends = await this.getFriends(connectedUser.id);

		for (const f of friends) {
			const friend = (await this.cache.get(`user ${f.id}`)) as ConnectedUser;

			if (!friend) continue;

			// Send event to my friends that I'm currently connected (online).
			this.server.to(friend.socketId).emit("friend-changed-status", {
				id: connectedUser.id,
				status: connectedUser.status
			});

			/*
			Since we don't store user's statuses in users table,
			we want to get their statuses on socket initialization
			based on their socket connection.
			*/
			if (connectedUser.status === ConnectedUserStatus.ONLINE) {
				this.server.to(connectedUser.socketId).emit("friend-changed-status", {
					id: friend.id,
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
