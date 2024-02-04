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
import { Chat, ChatType } from "@app/shared/entities";
import { extractTokenFromHeaders } from "@app/shared/helpers";
import { UserAccessToken } from "@app/shared/interfaces";
import { UserSocket } from "@app/shared/interfaces";

import { ChatService } from "./chat.service";
import {
	CreateMessageDto,
	GetChatDto,
	GetChatHistoryDto,
	GetUserChatsDto
} from "./dto";

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		private readonly chatService: ChatService,
		private readonly cache: RedisService
	) {}

	@WebSocketServer()
	server: Server;
	logger: Logger = new Logger(ChatGateway.name);

	// * Connection handlers
	async handleConnection(socket: UserSocket) {
		const token = extractTokenFromHeaders(socket.handshake.headers);
		if (!token) return socket.disconnect(true);

		const decodedToken$ = this.authService.send<UserAccessToken>(
			{ cmd: "decode-access-token" },
			{ token }
		);

		const decodedToken = await firstValueFrom(decodedToken$).catch(e =>
			this.logger.error(e)
		);
		if (!decodedToken || !decodedToken.user) return socket.disconnect(true);

		socket.data.user = decodedToken.user;

		await this.cache.setChatUser({
			socketId: socket.id,
			userId: decodedToken.user.id
		});
	}

	async handleDisconnect(socket: UserSocket) {
		if (socket.data?.user) {
			await this.cache.deleteChatUser(socket.data.user.id);
		}
	}

	// * Client events
	@SubscribeMessage("get-chats")
	async handleGetUserChats(
		socket: UserSocket,
		payload: Omit<GetUserChatsDto, "userId">
	) {
		const chats = await this.chatService.getUserChats({
			userId: socket.data.user.id,
			limit: payload.limit,
			page: payload.page
		});

		socket.emit("chats", chats);
	}

	@SubscribeMessage("get-chat")
	async handleGetChat(socket: UserSocket, payload: GetChatDto) {
		const chat = await this.chatService.getChat({
			currentUserId: socket.data.user.id,
			polymorphicId: payload.polymorphicId
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

		const { chat, message, hasBeenCreated } = await this.chatService.createMessage(
			socket.data.user.id,
			newMessage
		);

		chat.participants.forEach(async chatParticipant => {
			const connectedUser = await this.cache.getChatUser(chatParticipant.user.id);
			if (!connectedUser) return;

			this.server
				.to(connectedUser.socketId)
				.emit("new-message", { chat_id: chat.id, message });

			if (hasBeenCreated) {
				this.server.to(connectedUser.socketId).emit("chat-created", chat);
			}
		});
	}
}
