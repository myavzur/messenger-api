import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { User } from "./user.entity";

@Entity("messages")
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	created_at: Date;

	@Column("text")
	text: string;

	@ManyToOne(() => User, user => user.messages)
	user: User;

	@ManyToOne(() => Chat, chat => chat.messages)
	chat: Chat;
}
