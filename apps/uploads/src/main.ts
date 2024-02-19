import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { RabbitMQService } from "@app/rabbitmq";

import { UploadsModule } from "./uploads.module";

async function bootstrap() {
	const app = await NestFactory.create(UploadsModule);

	app.enableCors();

	// Services
	const configService = app.get(ConfigService);
	const rabbitMqService = app.get(RabbitMQService);

	app.connectMicroservice(
		rabbitMqService.getOptions(configService.get("RABBITMQ_UPLOADS_QUEUE"))
	);
	await app.startAllMicroservices();

	await app.listen(process.env.UPLOADS_SERVICE_PORT);
}
bootstrap();
