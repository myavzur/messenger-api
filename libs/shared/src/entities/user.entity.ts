import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { Message } from "./message.entity";

@Entity({ name: "users" })
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	created_at: Date;

	@Column("varchar", { length: 50, unique: true })
	email: string;

	@Column("varchar", { length: 30, unique: true })
	account_name: string;

	@Column("varchar", { length: 80, nullable: true })
	first_name: string;

	@Column("varchar", { length: 80, nullable: true })
	last_name: string;

	@Column("varchar", { length: 255, select: false })
	password: string;

	@ManyToMany(() => Chat, chat => chat.users)
	chats: Chat[];

	@OneToMany(() => Message, message => message.user)
	messages: Message[];
}
