import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { User } from "./user.entity";

export enum ChatUserRole {
	PARTICIPANT = "participant",
	ADMIN = "admin",
	OWNER = "owner"
}

@Entity("chats_has_users")
export class ChatUser {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: "enum",
		enum: ChatUserRole,
		default: ChatUserRole.PARTICIPANT
	})
	role: ChatUserRole;

	// * Relations
	@ManyToOne(() => Chat, chat => chat.users, { onDelete: "CASCADE" })
	@JoinColumn({
		name: "chat_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chu_chat"
	})
	chat: Chat;

	@ManyToOne(() => User, user => user.chats, { onDelete: "CASCADE" })
	@JoinColumn({
		name: "user_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chu_user"
	})
	user: User;
}
