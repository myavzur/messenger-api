import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";

import { PostgresModule } from "@app/postgres";
import { RabbitMQModule } from "@app/rabbitmq";
import { User } from "@app/shared/entities";
import { UserRepository } from "@app/shared/repositories";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

// Current Working Direction (node process) = messenger/api
const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		}),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get("APP_SECRET_KEY"),
				signOptions: {
					expiresIn: "3h"
				}
			})
		}),
		RabbitMQModule,
		PostgresModule
	],
	controllers: [AuthController],
	providers: [AuthService, UserRepository]
})
export class AuthModule {}
