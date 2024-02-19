import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "path";

import { PostgresModule } from "@app/postgres";
import { RabbitMQModule } from "@app/rabbitmq";
import { RedisModule } from "@app/redis";
import { AttachmentRepository } from "@app/shared/repositories";

import { AttachmentService } from "./services";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

const CWD = process.cwd();

console.log(path.join(__dirname, "..", "public"));
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
		}),
		RedisModule,
		PostgresModule
	],
	controllers: [UploadsController],
	providers: [UploadsService, AttachmentService, AttachmentRepository]
})
export class UploadsModule {}
