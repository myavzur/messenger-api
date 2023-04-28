import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as path from "path";

import { RabbitMQModule } from "@app/rabbitmq";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

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
			service: "PRESENCE_SERVICE",
			queue: process.env.RABBITMQ_PRESENCE_QUEUE
		})
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
