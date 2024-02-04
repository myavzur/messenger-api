import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";

import { PostgresModule } from "@app/postgres";
import { RabbitMQModule } from "@app/rabbitmq";
import { RedisModule } from "@app/redis";
import { Chat, ChatParticipant, Message, User } from "@app/shared/entities";
import { ChatRepository, MessageRepository } from "@app/shared/repositories";

import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

// Current Working Direction (node process) = messenger/api
const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		}),
		TypeOrmModule.forFeature([User, Chat, ChatParticipant, Message]),

		RedisModule,
		PostgresModule,
		RabbitMQModule.register({
			service: "AUTH_SERVICE",
			queue: process.env.RABBITMQ_AUTH_QUEUE
		})
	],
	controllers: [ChatController],
	providers: [ChatService, ChatGateway, ChatRepository, MessageRepository]
})
export class ChatModule {}
