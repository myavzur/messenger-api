import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { Attachment } from "./attachment.entity";
import { ChatParticipant } from "./chat-participant.entity";
import { Message } from "./message.entity";

export enum UserRole {
	USER = "user",
	ADMIN = "admin"
}

@Entity({ name: "users" })
export class User {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@CreateDateColumn()
	created_at: Date;

	@Column("varchar", { length: 30, unique: true })
	account_name: string;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.USER
	})
	role: UserRole;

	@Column("varchar", { length: 50, unique: true, select: false })
	email: string;

	@Column("varchar", { length: 255, select: false })
	password: string;

	@Column("timestamp", { default: () => "CURRENT_TIMESTAMP(6)", nullable: false })
	last_seen_at: Date;

	// * Relations
	avatar_attachment_id: Attachment["id"];

	@OneToOne(() => Attachment, () => null, {
		eager: true
	})
	@JoinColumn({
		name: "avatar_attachment_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_user_avatar"
	})
	avatar: Attachment;

	@OneToMany(() => ChatParticipant, chatParticipant => chatParticipant.user)
	participates: ChatParticipant[];

	@OneToMany(() => Message, message => message.user)
	messages: Message[];
}
