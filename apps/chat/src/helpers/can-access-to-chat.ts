import { Chat, User } from "@app/shared/entities";

export const canAccessChat = (userId: User["id"], chat: Chat) => {
	return Boolean(
		chat.participants.find(participant => participant.user.id === userId)
	);
};
