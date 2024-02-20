import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { File } from "./file.entity";
import { User } from "./user.entity";

@Entity("messages")
export class Message {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@CreateDateColumn()
	created_at: Date;

	@Column("text", { nullable: true })
	text: string | null;

	// * Relations
	@OneToOne(() => Message, message => message.reply_for, {
		onDelete: "SET NULL"
	})
	@JoinColumn({
		name: "reply_for_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_reply_for"
	})
	reply_for: Message;

	@OneToMany(() => File, file => file.message, {
		eager: true
	})
	attachments: File[];

	@ManyToOne(() => User, user => user.messages, {
		onDelete: "CASCADE",
		eager: true
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
