import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { Message } from "./message.entity";
import { User } from "./user.entity";

export enum FileTag {
	FILE = "file",
	MEDIA = "media",
	VOICE = "voice",
	CIRCLE = "circle",
	AVATAR = "avatar"
}

@Entity("files")
export class File {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@CreateDateColumn()
	created_at: Date;

	@Column({
		type: "enum",
		enum: FileTag,
		default: FileTag.FILE
	})
	tag: FileTag;

	@Column("varchar")
	file_url: string;

	@Column("varchar")
	file_name: string;

	@Column("int")
	file_size: number;

	@Column("varchar")
	file_type: string; // MimeType

	// * Relations
	@ManyToOne(() => User, () => null, { onDelete: "SET NULL" })
	@JoinColumn({
		name: "user_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_file_user"
	})
	user: User;

	@ManyToOne(() => Message, message => message.attachments, {
		onDelete: "SET NULL"
	})
	@JoinColumn({
		name: "message_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_file_message"
	})
	message?: Message;

	@ManyToOne(() => Chat, chat => chat.attachments, {
		onDelete: "SET NULL"
	})
	@JoinColumn({
		name: "chat_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_file_chat"
	})
	chat?: Chat;
}
