import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";

import { dataSourceOptions } from "./database/data-source";

// Current Working Direction (node process) = messenger/api
const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		}),

		TypeOrmModule.forRoot({
			...dataSourceOptions,
			/* Using {synchronize: true} in production will cause losing data.
			 * For production use migrations instead. (`npm run migration:generate -- apps/auth/database/migrations/InitDatabase`, `npm run migration:run`, etc...) */
			synchronize: true
		})
	]
})
export class PostgresModule {}
