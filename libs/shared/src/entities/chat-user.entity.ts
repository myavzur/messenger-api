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
	PARTICIPANT,
	ADMIN,
	OWNER
}

@Entity("chats_has_users")
export class ChatUser {
	@PrimaryGeneratedColumn("increment")
	id: number;

	// * Relations
	@ManyToOne(() => Chat, {
		onDelete: "CASCADE"
	})
	@JoinColumn({
		name: "chat_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chu_chat"
	})
	chat: Chat;

	@ManyToOne(() => User)
	@JoinColumn({
		name: "user_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chu_user"
	})
	user: User;

	@Column({
		type: "enum",
		enum: ChatUserRole,
		default: ChatUserRole.PARTICIPANT
	})
	role: ChatUserRole;
}
