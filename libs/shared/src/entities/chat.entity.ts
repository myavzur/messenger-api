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
			name: "chat_id",
			referencedColumnName: "id"
		},
		inverseJoinColumn: {
			name: "user_id",
			referencedColumnName: "id"
		}
	})
	users: User[];

	@OneToMany(() => Message, message => message.chat)
	messages: Message[];

	@OneToOne(() => Message)
	@JoinColumn({ name: "last_message_id", referencedColumnName: "id" })
	last_message: Message;
}
