import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Message } from "./message.entity";

export enum AttachmentDisplay {
	MEDIA = "media",
	FILE = "file",
	VOICE = "voice"
}

@Entity("attachments")
export class Attachment {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	created_at: Date;

	@Column({
		type: "enum",
		enum: AttachmentDisplay,
		default: AttachmentDisplay.FILE
	})
	display: AttachmentDisplay;

	@Column("varchar")
	file_url: string;

	@Column("varchar")
	file_name: string;

	@Column("varchar")
	file_size: string;

	@Column("varchar")
	file_type: string; // MimeType

	@ManyToOne(() => Message, message => message.attachments, {
		onDelete: "CASCADE"
	})
	@JoinColumn({
		name: "message_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_attachment_message"
	})
	message: Message;
}
