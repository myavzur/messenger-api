import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn
} from "typeorm";

import { Chat } from "./chat.entity";
import { FriendRequest } from "./friend-request.entity";
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

	// * Relationships
	@OneToMany(() => FriendRequest, friend_request => friend_request.from_user)
	@JoinColumn({ name: "id", referencedColumnName: "to_user_id" })
	outgoing_friend_requests: FriendRequest[];

	@OneToMany(() => FriendRequest, friend_request => friend_request.to_user)
	@JoinColumn({ name: "id", referencedColumnName: "from_channel_id" })
	incoming_friend_requests: FriendRequest[];

	@ManyToMany(() => Chat, chat => chat.users)
	chats: Chat[];

	@OneToMany(() => Message, message => message.user)
	messages: Message[];
}
