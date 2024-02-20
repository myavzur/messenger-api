import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientProxyFactory, Transport } from "@nestjs/microservices";
import * as path from "path";

import { RegisterRMQPayload } from "./rabbitmq.interface";
import { RabbitMQService } from "./rabbitmq.service";

// Current Working Direction (node process) = messenger/api
const CWD = process.cwd();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: path.join(CWD, ".env")
		})
	],
	providers: [RabbitMQService],
	exports: [RabbitMQService]
})
export class RabbitMQModule {
	static register({ service, queue }: RegisterRMQPayload): DynamicModule {
		const providers = [
			{
				provide: service,
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => {
					const RABBITMQ_URI = configService.get("RABBITMQ_URI");

					return ClientProxyFactory.create({
						transport: Transport.RMQ,
						options: {
							urls: [RABBITMQ_URI],
							queue: queue,
							queueOptions: {
								// Data associated with Message Broker won't be lost between restarts.
								durable: true
							}
						}
					});
				}
			}
		];

		return {
			module: RabbitMQModule,
			providers: providers,
			exports: providers
		};
	}
}
