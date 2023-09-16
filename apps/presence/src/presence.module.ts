import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as path from "path";

import { RabbitMQModule } from "@app/rabbitmq";
import { RedisModule } from "@app/redis";

import { PresenceController } from "./presence.controller";
import { PresenceGateway } from "./presence.gateway";
import { PresenceService } from "./presence.service";

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
	controllers: [PresenceController],
	providers: [PresenceService, PresenceGateway]
})
export class PresenceModule {}
