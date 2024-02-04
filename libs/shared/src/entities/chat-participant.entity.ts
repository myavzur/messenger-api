import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { User } from "./user.entity";

export enum ChatParticipantRole {
	PARTICIPANT = "participant",
	ADMIN = "admin",
	OWNER = "owner"
}

@Entity("chats_has_participants")
export class ChatParticipant {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: "enum",
		enum: ChatParticipantRole,
		default: ChatParticipantRole.PARTICIPANT
	})
	role: ChatParticipantRole;

	// * Relations
	@ManyToOne(() => Chat, chat => chat.participants, { onDelete: "CASCADE" })
	@JoinColumn({
		name: "chat_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chu_chat"
	})
	chat: Chat;

	@ManyToOne(() => User, user => user.participates, { onDelete: "CASCADE" })
	@JoinColumn({
		name: "user_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chu_user"
	})
	user: User;
}
