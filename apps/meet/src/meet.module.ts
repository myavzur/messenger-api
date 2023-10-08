import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as path from "path";

import { RabbitMQModule } from "@app/rabbitmq";

import { MeetController } from "./meet.controller";
import { MeetService } from "./meet.service";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(process.cwd(), ".env")
		}),

		RabbitMQModule
	],
	controllers: [MeetController],
	providers: [MeetService]
})
export class MeetModule {}
