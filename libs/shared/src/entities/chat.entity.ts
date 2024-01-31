import {
	Column,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from "typeorm";

import { ChatUser } from "./chat-user.entity";
import { Message } from "./message.entity";
import { User } from "./user.entity";

@Entity("chats")
export class Chat {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@UpdateDateColumn()
	updated_at: string; // ISO date string

	@Column("varchar", { length: 128, nullable: true })
	title: string;

	@Column("boolean", { default: false })
	is_group: boolean;

	@Column("smallint", { default: 2 })
	users_count: number;

	// * Relations
	@OneToMany(() => ChatUser, chatUser => chatUser.chat)
	users: User[];

	@OneToMany(() => Message, message => message.chat, {})
	messages: Message[];

	@OneToOne(() => Message)
	@JoinColumn({
		name: "last_message_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chat_last_message"
	})
	last_message: Message;
}
