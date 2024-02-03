import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { User } from "./user.entity";

@Entity("messages")
export class Message {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@CreateDateColumn()
	created_at: Date;

	@Column("text", { nullable: true })
	text: string;

	// * Relations
	@ManyToOne(() => User, user => user.messages, {
		onDelete: "CASCADE"
	})
	@JoinColumn({
		name: "user_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_message_user"
	})
	user: User;

	@ManyToOne(() => Chat, chat => chat.messages, {
		onDelete: "CASCADE"
	})
	@JoinColumn({
		name: "chat_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_message_chat"
	})
	chat: Chat;
}
