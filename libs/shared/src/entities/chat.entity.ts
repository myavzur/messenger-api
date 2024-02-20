import {
	Column,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from "typeorm";

import { ChatParticipant } from "./chat-participant.entity";
import { File } from "./file.entity";
import { Message } from "./message.entity";

export enum ChatType {
	/** Такие чаты не хранятся в базе данных!
	 * Существуют лишь при открытии чата с пользователем,
	 * при условии, что физического чата ещё нет. */
	TEMP = "temp",
	LOCAL = "local",
	GROUP = "group"
}

@Entity("chats")
export class Chat {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@UpdateDateColumn()
	updated_at: string; // ISO date string

	@Column({
		type: "enum",
		enum: ChatType,
		default: ChatType.LOCAL
	})
	type: ChatType;

	@Column("varchar", { length: 128, nullable: true })
	title: string;

	@Column("smallint", { default: 2 })
	participants_count: number;

	// * Relations
	@OneToMany(() => ChatParticipant, chatParticipant => chatParticipant.chat)
	participants: ChatParticipant[];

	@OneToMany(() => Message, message => message.chat, {})
	messages: Message[];

	@OneToOne(() => Message)
	@JoinColumn({
		name: "last_message_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_chat_last_message"
	})
	last_message: Message;

	@OneToMany(() => File, file => file.chat)
	attachments?: File[];
}
