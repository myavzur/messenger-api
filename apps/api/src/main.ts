import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors();

	await app.listen(4000, () => {
		const logger = new Logger("Bootstrap");

		logger.verbose(`
      |----------------------------------------------------------------------|
      |       🎧 Server listening -> http://localhost:4000           |
      |----------------------------------------------------------------------|
			|      🏪 PG Admin -> http://localhost:15432          |
      |----------------------------------------------------------------------|
			|      🏪 RabbitMQ GUI -> http://localhost:15672          |
      |----------------------------------------------------------------------|
      |                   ⏲️  Launched: ${new Date()}                    |
      |----------------------------------------------------------------------|
    `);
	});
}
bootstrap();
