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
import { ConnectedUser, GetChatsPayload } from "./interfaces";

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

	async onModuleInit() {
		await this.cache.reset();
		this.logger.debug("Chat cache was reset.");
	}

	// * Connection handlers
	async handleConnection(socket: UserSocket) {
		this.logger.debug("[handleConnection]: Connection handled.");

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

		await this.chatService.setConnectedUser({
			socketId: socket.id,
			userId: tokenPayload.user.id
		});
	}

	async handleDisconnect(socket: UserSocket) {
		this.logger.debug("[handleDisconnect]: Disconnect handled.");

		if (socket.data?.user) {
			this.logger.debug("[handleDisconnect]: Deleting connection from cache.");
			await this.chatService.deleteConnectedUserById(socket.data.user.id);
		}
	}

	// * Client events
	@SubscribeMessage("get-chats")
	async handleGetChats(socket: UserSocket, payload: Omit<GetChatsPayload, 'userId'>) {
		const chatsData = await this.chatService.findChats({
			userId: socket.data.user.id,
			limit: payload.limit,
			page: payload.page
		});

		socket.emit('get-chats', chatsData);
	}

	@SubscribeMessage("send-message")
	async handleSendMessage(socket: UserSocket, newMessage: CreateMessageDto) {
		if (!newMessage) return null;

		const { message, updatedChat } = await this.chatService.createMessage(
			socket.data.user.id,
			newMessage
		);

		updatedChat.users.forEach(async user => {
			const connectedUser = await this.chatService.getConnectedUserById(user.id);
			if (!connectedUser) return;

			this.server.to(connectedUser.socketId).emit("new-message", {
				message,
				from_user_id: socket.data.user.id,
				chat_id: updatedChat.id
			});
		})
	}
}
