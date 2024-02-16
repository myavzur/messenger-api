import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";

import { PostgresModule } from "@app/postgres";
import { RabbitMQModule } from "@app/rabbitmq";
import { Attachment } from "@app/shared/entities";

import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

const CWD = process.cwd();

@Module({
	imports: [
		TypeOrmModule.forFeature([Attachment]),
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
		PostgresModule
	],
	controllers: [UploadsController],
	providers: [UploadsService]
})
export class UploadsModule {}
