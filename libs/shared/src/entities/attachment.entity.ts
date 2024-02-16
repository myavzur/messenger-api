import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Message } from "./message.entity";
import { User } from "./user.entity";

export enum AttachmentTag {
	FILE = "file",
	MEDIA = "media",
	VOICE = "voice",
	CIRCLE = "circle",
	AVATAR = "avatar"
}

@Entity("attachments")
export class Attachment {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@CreateDateColumn()
	created_at: Date;

	@Column({
		type: "enum",
		enum: AttachmentTag,
		default: AttachmentTag.FILE
	})
	tag: AttachmentTag;

	@Column("varchar")
	file_url: string;

	@Column("varchar")
	file_name: string;

	@Column("int")
	file_size: number;

	@Column("varchar")
	file_type: string; // MimeType

	// * Relations
	user_id: User["id"];
	message_id: Message["id"];

	@ManyToOne(() => User, () => null, { onDelete: "SET NULL" })
	@JoinColumn({
		name: "user_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_attachment_user"
	})
	user: User;
}
