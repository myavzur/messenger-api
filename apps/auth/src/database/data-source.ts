import { DataSource, DataSourceOptions } from "typeorm";

import { User } from "@app/shared/entities";

export const dataSourceOptions: DataSourceOptions = {
	type: "postgres",
	url: process.env.POSTGRES_URI,
	entities: [User],
	migrations: ["dist/apps/auth/database/migrations/*.js"]
};

export const dataSource = new DataSource(dataSourceOptions);
