import { Chat, Message, User } from "@app/shared/entities";

// * Server
export interface ServerToClientEvents {
	chats: (data: {
		chats: Chat[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
	}) => void;
	chat: (data: Chat) => void;
	"new-chat": (data: Chat) => void;
	"new-message": (data: { chat_id: Chat["id"]; message: Message }) => void;
	"chat-history": (data: {
		chat_id: Chat["id"];
		messages: Message[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
	}) => void;
}

// * Client
export interface ClientToServerEvents {
	"get-chats": (params: { page: number; limit: number }) => void;
	"get-chat": (params: { chatId: Chat["id"] }) => void;
	"get-chat-history": (params: {
		chatId: Chat["id"];
		page: number;
		limit: number;
	}) => void;
	"send-message": (params: {
		chatId?: Chat["id"];
		userId?: User["id"];
		text: Message["text"];
	}) => void;
}
