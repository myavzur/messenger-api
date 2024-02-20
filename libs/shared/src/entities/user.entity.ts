import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { ChatParticipant } from "./chat-participant.entity";
import { File } from "./file.entity";
import { Message } from "./message.entity";

export enum UserRole {
	USER = "user",
	ADMIN = "admin"
}

export enum UserColor {
	SOFT_CORAL,
	SUNSET_ORANGE,
	LAVENDER_PURPLE,
	FRESH_LIME,
	AQUA_MARINE,
	SKY_BLUE,
	PINK_ORCHID
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

	@Column({
		type: "enum",
		enum: UserColor,
		default: UserColor.SUNSET_ORANGE
	})
	color: UserColor;

	@Column("varchar", { length: 50, unique: true, select: false })
	email: string;

	@Column("varchar", { length: 255, select: false })
	password: string;

	@Column("timestamp", { default: () => "CURRENT_TIMESTAMP(6)", nullable: false })
	last_seen_at: Date;

	// * Relations
	@OneToOne(() => File, () => null, {
		eager: true
	})
	@JoinColumn({
		name: "avatar_file_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "FK_user_avatar"
	})
	avatar: File;

	@OneToMany(() => ChatParticipant, chatParticipant => chatParticipant.user)
	participates: ChatParticipant[];

	@OneToMany(() => Message, message => message.user)
	messages: Message[];
}
