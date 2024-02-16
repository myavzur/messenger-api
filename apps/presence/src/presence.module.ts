import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as path from "path";

import { RabbitMQModule } from "@app/rabbitmq";
import { RedisModule } from "@app/redis";

import { PresenceGateway } from "./presence.gateway";

// Current Working Direction (node process) = messenger/api
const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		}),
		RabbitMQModule.register({
			service: "AUTH_SERVICE",
			queue: process.env.RABBITMQ_AUTH_QUEUE
		}),
		RabbitMQModule.register({
			service: "CHAT_SERVICE",
			queue: process.env.RABBITMQ_CHAT_QUEUE
		}),
		RedisModule
	],
	providers: [PresenceGateway]
})
export class PresenceModule {}
