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
import { Chat, User } from "@app/shared/entities";
import { extractTokenFromHeaders } from "@app/shared/helpers";
import { UserAccessToken } from "@app/shared/interfaces";
import { UserSocket } from "@app/shared/interfaces";

import {
	CreateGroupChatDto,
	CreateMessageDto,
	DeleteMessagesDto,
	GetChatDto,
	GetChatHistoryDto,
	GetUserChatsDto
} from "./dto";
import { ChatService } from "./services";

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		@Inject("AUTH_SERVICE")
		private readonly authService: ClientProxy,
		@Inject("UPLOADS_SERVICE")
		private readonly uploadsService: ClientProxy,
		private readonly chatService: ChatService,
		private readonly redisService: RedisService
	) {}

	@WebSocketServer()
	server: Server;
	logger: Logger = new Logger(ChatGateway.name);

	// * Connection handlers
	async handleConnection(socket: UserSocket) {
		const token = extractTokenFromHeaders(socket.handshake.headers);
		if (!token) return socket.disconnect(true);

		const decodedToken$ = this.authService.send<UserAccessToken, string>(
			{ cmd: "decode-access-token" },
			token
		);

		const decodedToken = await firstValueFrom(decodedToken$).catch(e =>
			this.logger.error(e)
		);
		if (!decodedToken || !decodedToken.user) return socket.disconnect(true);

		socket.data.user = decodedToken.user;

		await this.redisService.setChatUser({
			socketId: socket.id,
			userId: decodedToken.user.id
		});
	}

	async handleDisconnect(socket: UserSocket) {
		const userId = socket.data?.user?.id;
		if (!userId) return;

		await this.redisService.deleteChatUser(userId);

		await firstValueFrom(
			this.uploadsService.send<Promise<void>, User["id"]>(
				{
					cmd: "delete-unused-files"
				},
				userId
			)
		).catch(e => {
			this.logger.error("handleDisconnect: Failed to flush unused files");
			this.logger.error(e);
		});
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
				const connectedUser = await this.redisService.getChatUser(
					chatParticipant.user.id
				);
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
		const currentUserId = socket.data.user.id;

		const { chat, error } = await this.chatService.getChat({
			currentUserId,
			polymorphicId: payload.polymorphicId
		});

		// Returning temporary chat.
		if (!chat && !error) {
			const temporaryChat = await this.chatService.getTemporaryChat(
				payload.polymorphicId
			);
			if (!temporaryChat) return { error: "ERROR_ON_CREATE_TEMPORARY_CHAT" };
			return temporaryChat;
		}

		return chat;
	}

	@SubscribeMessage("get-chat-history")
	async handleGetChatHistory(socket: UserSocket, payload: GetChatHistoryDto) {
		const history = await this.chatService.getChatHistory(
			socket.data.user.id,
			payload
		);

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
		const hasContent = payload.text || payload.fileIds?.length || payload.replyForId;
		if (!hasContent) return { error: "ERROR_EMPTY_MESSAGE" };

		const { chatId, message, hasBeenCreated } = await this.chatService.createMessage(
			socket.data.user.id,
			payload
		);

		if (hasBeenCreated) {
			await this.broadcastToChat(chatId, "new-chat", chat => chat);
		}

		await this.broadcastToChat(chatId, "new-message", {
			chat_id: chatId,
			message
		});

		return {
			chat_id: chatId,
			message_id: message.id
		};
	}

	@SubscribeMessage("change-message")
	async handleChangeMessage(socket: UserSocket, payload: any) {
		console.log(socket, payload);
		return;
	}

	@SubscribeMessage("pin-message")
	async handlePinMessage(socket: UserSocket, payload: any) {
		console.log(socket, payload);
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
