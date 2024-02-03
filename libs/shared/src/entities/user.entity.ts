import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn
} from "typeorm";

import { ChatUser } from "./chat-user.entity";
import { Chat } from "./chat.entity";
import { Message } from "./message.entity";

@Entity({ name: "users" })
export class User {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@CreateDateColumn()
	created_at: Date;

	@Column("varchar", { length: 50, unique: true })
	email: string;

	@Column("varchar", { length: 255, select: false })
	password: string;

	@Column("varchar", { length: 30, unique: true })
	account_name: string;

	@Column("varchar", { length: 120, nullable: true })
	avatar_url: string;

	@Column("timestamp", { default: () => "CURRENT_TIMESTAMP(6)", nullable: false })
	last_seen_at: Date;

	// * Relations
	@OneToMany(() => ChatUser, chatUser => chatUser.user)
	chats: Chat[];

	@OneToMany(() => Message, message => message.user)
	messages: Message[];
}
