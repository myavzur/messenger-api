import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from "typeorm";

import { User } from "./user.entity";

@Entity({ name: "friend_requests" })
export class FriendRequest {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	created_at: Date;

	@Column("smallint", { default: 1 })
	status: number;

	@ManyToOne(() => User, user => user.incoming_friend_requests)
	@JoinColumn({ name: "from_user_id", referencedColumnName: "id" })
	from_user: User;

	@ManyToOne(() => User, user => user.outgoing_friend_requests)
	@JoinColumn({ name: "to_user_id", referencedColumnName: "id" })
	to_user: User;
}
