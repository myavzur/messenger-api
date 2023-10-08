import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { RabbitMQService } from "@app/rabbitmq";

import { MeetModule } from "./meet.module";

async function bootstrap() {
	const app = await NestFactory.create(MeetModule);

	// Services
	const configService = app.get(ConfigService);
	const rabbitMqService = app.get(RabbitMQService);

	app.connectMicroservice(
		rabbitMqService.getOptions(configService.get("RABBITMQ_MEET_QUEUE"))
	);

	app.startAllMicroservices();
}
bootstrap();
