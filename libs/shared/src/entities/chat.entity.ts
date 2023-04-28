import {
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from "typeorm";

import { Message } from "./message.entity";
import { User } from "./user.entity";

@Entity("chats")
export class Chat {
	@PrimaryGeneratedColumn()
	id: number;

	@UpdateDateColumn()
	updated_at: Date;

	@ManyToMany(() => User)
	@JoinTable({
		name: "chats_has_users",
		joinColumn: {
			name: "chatId",
			referencedColumnName: "id"
		},
		inverseJoinColumn: {
			name: "userId",
			referencedColumnName: "id"
		}
	})
	users: User[];

	@OneToMany(() => Message, message => message.chat)
	messages: Message[];
}
