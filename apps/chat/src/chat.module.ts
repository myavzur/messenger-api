import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as path from "path";

import { PostgresModule } from "@app/postgres";
import { RabbitMQModule } from "@app/rabbitmq";
import { RedisModule } from "@app/redis";
import {
	ChatRepository,
	FileRepository,
	MessageRepository
} from "@app/shared/repositories";

import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { ChatService, MessageService } from "./services";

const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		}),
		RedisModule,
		PostgresModule,
		RabbitMQModule.register({
			service: "AUTH_SERVICE",
			queue: process.env.RABBITMQ_AUTH_QUEUE
		}),
		RabbitMQModule.register({
			service: "UPLOADS_SERVICE",
			queue: process.env.RABBITMQ_UPLOADS_QUEUE
		})
	],
	controllers: [ChatController],
	providers: [
		ChatService,
		ChatGateway,
		ChatRepository,
		MessageService,
		MessageRepository,
		FileRepository
	]
})
export class ChatModule {}
