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
import { extractTokenFromHeaders } from "@app/shared/helpers";
import { UserAccessToken } from "@app/shared/interfaces";
import { UserSocket } from "@app/shared/interfaces";

import { ChatService } from "./chat.service";
import { CreateMessageDto, GetChatDto, GetChatHistoryDto, GetChatsDto } from "./dto";

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		private readonly chatService: ChatService,
		private readonly cache: RedisService,
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

		const decodedToken$ = this.authService.send<UserAccessToken>(
			{ cmd: "decode-access-token" },
			{ token }
		);
		const tokenPayload = await firstValueFrom(decodedToken$).catch(e =>
			this.logger.error(e)
		);

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
	async handleGetChats(socket: UserSocket, payload: Omit<GetChatsDto, "userId">) {
		const chats = await this.chatService.getChats({
			userId: socket.data.user.id,
			limit: payload.limit,
			page: payload.page
		});

		socket.emit("chats", chats);
	}

	@SubscribeMessage("get-chat")
	async handleGetChat(socket: UserSocket, payload: Omit<GetChatDto, "userId">) {
		const chat = await this.chatService.getChat({
			userId: socket.data.user.id,
			chatId: payload.chatId
		});

		socket.emit("chat", chat);
	}

	@SubscribeMessage("get-chat-history")
	async handleGetChatHistory(socket: UserSocket, payload: GetChatHistoryDto) {
		const history = await this.chatService.getChatHistory(payload);
		socket.emit("chat-history", {
			chat_id: payload.chatId,
			...history
		});
	}

	@SubscribeMessage("send-message")
	async handleSendMessage(socket: UserSocket, newMessage: CreateMessageDto) {
		if (!newMessage) return null;

		const { chat, message, isCreated } = await this.chatService.createMessage(
			socket.data.user.id,
			newMessage
		);

		chat.users.forEach(async user => {
			const connectedUser = await this.chatService.getConnectedUserById(user.id);
			if (!connectedUser) return;

			this.server
				.to(connectedUser.socketId)
				.emit("new-message", { chat_id: chat.id, message });

			if (isCreated) {
				this.server.to(connectedUser.socketId).emit("chat-created", chat);
			}
		});
	}
}
