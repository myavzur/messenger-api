import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { UploadsModule } from "./uploads.module";

async function bootstrap() {
	const app = await NestFactory.create(UploadsModule);

	app.enableCors();

	await app.listen(process.env.UPLOADS_SERVICE_PORT, () => {
		const logger = new Logger("Bootstrap");
		logger.log("Started successfully.");
		logger.log(`Running on ${process.env.UPLOADS_SERVICE_PORT} port.`);
	});
}
bootstrap();
