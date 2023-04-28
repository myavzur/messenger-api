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
import { UserAccessToken } from "@app/shared/interfaces";
import { UserSocket } from "@app/shared/interfaces";

import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto";
import { ConnectedUser } from "./interfaces";

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private readonly chatService: ChatService,
		private readonly cache: RedisService,
		@Inject("AUTH_SERVICE") private readonly authService: ClientProxy,
		@Inject("PRESENCE_SERVICE") private readonly presenceService: ClientProxy
	) {}

	@WebSocketServer()
	server: Server;
	logger: Logger = new Logger(ChatGateway.name);

	// * Connection handlers
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
		await this.setConnectedUser(socket);
	}

	async handleDisconnect(socket: UserSocket) {
		this.logger.debug("Disconnect handled.");
	}

	// * Client events
	@SubscribeMessage("send-message")
	async handleSendMessage(socket: UserSocket, newMessage: CreateMessageDto) {
		if (!newMessage) return null;

		// TODO: Delete or Refactor
		const user = socket.data?.user;
		if (!user) return null;

		const message = await this.chatService.createMessage(user.id, newMessage);

		// Send message to friend if he is connected to chat server by WebSockets.
		const connectedFriend = await this.getConnectedUserById(newMessage.friendId);

		if (connectedFriend) {
			this.server.to(connectedFriend.socketId).emit("new-message", {
				message,
				from_user_id: user.id,
				chat_id: newMessage.chatId
			});
		}
	}

	// * Helpers
	async setConnectedUser(socket: UserSocket) {
		const user = socket.data?.user;

		if (!user || !user.id) return null;

		const connectedUser: ConnectedUser = {
			userId: user.id,
			socketId: socket.id
		};

		await this.cache.set(`chat-user ${user.id}`, connectedUser);
	}

	async getConnectedUserById(
		userId: User["id"]
	): Promise<ConnectedUser | undefined> {
		return (await this.cache.get(`chat-user ${userId}`)) as
			| ConnectedUser
			| undefined;
	}
}
