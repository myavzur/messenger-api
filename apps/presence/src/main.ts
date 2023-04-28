import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { RabbitMQService } from "@app/rabbitmq";

import { PresenceModule } from "./presence.module";

async function bootstrap() {
	const app = await NestFactory.create(PresenceModule);

	app.enableCors();

	// Services
	const configService = app.get(ConfigService);
	const rabbitMqService = app.get(RabbitMQService);

	app.connectMicroservice(
		rabbitMqService.getOptions(configService.get("RABBITMQ_PRESENCE_QUEUE"))
	);
	await app.startAllMicroservices();

	await app.listen(process.env.PRESENCE_SERVICE_PORT);
}
bootstrap();
