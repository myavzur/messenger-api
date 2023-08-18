import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors();

	await app.listen(process.env.API_GATEWAY_PORT, () => {
		const logger = new Logger("Bootstrap");
		logger.log("Started successfully.");
	});
}
bootstrap();
