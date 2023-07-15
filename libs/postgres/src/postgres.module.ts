import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";

import { User } from "@app/shared/entities";
import { Chat } from "@app/shared/entities/chat.entity";
import { Message } from "@app/shared/entities/message.entity";

// Current Working Direction (node process) = messenger/api
const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		}),

		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				type: "postgres",
				url: configService.get("POSTGRES_URI"),
				entities: [User, Chat, Message],
				/*
					Using {synchronize: true} in production will cause losing data.
					For production use migrations instead. (`npm run migration:generate -- apps/auth/database/migrations/InitDatabase`, `npm run migration:run`, etc...)
				*/
				synchronize: true
			})
		})
	]
})
export class PostgresModule {}
