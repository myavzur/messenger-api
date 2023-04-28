import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { RabbitMQService } from "@app/rabbitmq";

import { AuthModule } from "./auth.module";

async function bootstrap() {
	const app = await NestFactory.create(AuthModule);

	// Services
	const configService = app.get(ConfigService);
	const rabbitMqService = app.get(RabbitMQService);

	app.connectMicroservice(
		rabbitMqService.getOptions(configService.get("RABBITMQ_AUTH_QUEUE"))
	);

	app.startAllMicroservices();
}
bootstrap();
