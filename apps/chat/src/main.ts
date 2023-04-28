import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { RabbitMQService } from "@app/rabbitmq";

import { ChatModule } from "./chat.module";

async function bootstrap() {
	const app = await NestFactory.create(ChatModule);

	app.enableCors();

	// Services
	const configService = app.get(ConfigService);
	const rabbitMqService = app.get(RabbitMQService);

	app.connectMicroservice(
		rabbitMqService.getOptions(configService.get("RABBITMQ_CHAT_QUEUE"))
	);
	await app.startAllMicroservices();

	await app.listen(process.env.CHAT_SERVICE_PORT);
}
bootstrap();
