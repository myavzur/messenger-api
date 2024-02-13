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
	CreateGroupChatDto,
	CreateMessageDto,
	DeleteMessagesDto,
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

	// * Helpers
	/** Emits `event` to for all `Chat.participants` of `Chat` */
	async broadcastToChat(chatId: Chat["id"], event: string, payload: any) {
		const chat = await this.chatService.getChatForBroadcast(chatId);

		if (!chat.participants || chat.participants.length === 0) {
			this.logger.warn(
				`[broadcastToChat] Chat ID: ${chat.id} has no participants. Is something went wrong?`
			);
			return;
		}

		return await Promise.all(
			chat.participants.map(async chatParticipant => {
				const connectedUser = await this.cache.getChatUser(chatParticipant.user.id);
				if (!connectedUser) return;
				const data = typeof payload === "function" ? payload(chat) : payload;
				this.server.to(connectedUser.socketId).emit(event, data);
			})
		);
	}

	// * Client events
	@SubscribeMessage("get-chats")
	async handleGetUserChats(
		socket: UserSocket,
		payload: Omit<GetUserChatsDto, "userId">
	) {
		return await this.chatService.getUserChats({
			userId: socket.data.user.id,
			limit: payload.limit,
			page: payload.page
		});
	}

	@SubscribeMessage("get-chat")
	async handleGetChat(socket: UserSocket, payload: GetChatDto) {
		return await this.chatService.getChat({
			currentUserId: socket.data.user.id,
			polymorphicId: payload.polymorphicId
		});
	}

	@SubscribeMessage("get-chat-history")
	async handleGetChatHistory(socket: UserSocket, payload: GetChatHistoryDto) {
		const history = await this.chatService.getChatHistory(payload);

		return {
			chat_id: payload.chatId,
			...history
		};
	}

	@SubscribeMessage("create-group-chat")
	async handleCreateGroupChat(socket: UserSocket, payload: CreateGroupChatDto) {
		const groupChat = await this.chatService.createGroupChat({
			creatorId: socket.data.user.id,
			participantsIds: payload.participantsIds,
			title: payload.title
		});

		await this.broadcastToChat(groupChat.id, "new-chat", chat => chat);

		return {
			chatId: groupChat.id
		};
	}

	@SubscribeMessage("send-message")
	async handleSendMessage(socket: UserSocket, payload: CreateMessageDto) {
		if (!payload) return null;

		const { chat, message, hasBeenCreated } = await this.chatService.createMessage(
			socket.data.user.id,
			payload
		);

		if (hasBeenCreated) {
			await this.broadcastToChat(chat.id, "new-chat", chat => chat);
		}

		await this.broadcastToChat(chat.id, "new-message", {
			chat_id: chat.id,
			message
		});

		return {
			chat_id: chat.id,
			message_id: message.id
		};
	}

	@SubscribeMessage("change-message")
	async handleChangeMessage(socket: UserSocket, payload: any) {
		return;
	}

	@SubscribeMessage("pin-message")
	async handlePinMessage(socket: UserSocket, payload: any) {
		return;
	}

	@SubscribeMessage("delete-messages")
	async handleDeleteMessage(socket: UserSocket, payload: DeleteMessagesDto) {
		const goneMessageIds = await this.chatService.deleteMessages({
			removerId: socket.data.user.id,
			messageIds: payload.messageIds,
			chatId: payload.chatId
		});

		// No need to emit "gone-messages" event if no messages were deleted.
		if (goneMessageIds.length > 0) {
			this.broadcastToChat(payload.chatId, "gone-messages", {
				chat_id: payload.chatId,
				message_ids: goneMessageIds
			});
		}
	}
}
