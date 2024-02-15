import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { UploadsModule } from "./uploads.module";

async function bootstrap() {
	const app = await NestFactory.create(UploadsModule);
	await app.listen(process.env.UPLOADS_SERVICE_PORT, () => {
		const logger = new Logger("Bootstrap");
		logger.log("Started successfully.");
	});
}
bootstrap();
