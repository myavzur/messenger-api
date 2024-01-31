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
	updated_at: string; // ISO date string

	@Column("varchar", { length: 128, nullable: true })
	title: string;

	@Column("boolean", { default: false })
	is_group: boolean;

	@Column("smallint", {
		default: 2,
		comment:
			"Минимальное значение юзеров чата 2. Поэтому логично считать это число дефолтным значением."
	})
	users_count: number;

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
