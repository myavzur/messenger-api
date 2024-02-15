import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "path";

import { RabbitMQModule } from "@app/rabbitmq";

import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		}),

		ServeStaticModule.forRoot({
			rootPath: path.join(__dirname, "..", "public")
		}),

		RabbitMQModule.register({
			service: "AUTH_SERVICE",
			queue: process.env.RABBITMQ_AUTH_QUEUE
		})
	],
	controllers: [UploadsController],
	providers: [UploadsService]
})
export class UploadsModule {}
