import { DataSource, DataSourceOptions } from "typeorm";

import { Chat, ChatParticipant, File, Message, User } from "@app/shared/entities";

export const dataSourceOptions: DataSourceOptions = {
	type: "postgres",
	url: process.env.POSTGRES_URI,
	entities: [User, Chat, ChatParticipant, Message, File],
	migrations: ["dist/apps/postgres/database/migrations/*.js"] // TODO: MAKE SURE IT WORKS!!!
};

export const dataSource = new DataSource(dataSourceOptions);
