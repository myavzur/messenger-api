import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RmqContext, RmqOptions, Transport } from "@nestjs/microservices";

@Injectable()
export class RabbitMQService {
	constructor(private readonly configService: ConfigService) {}

	getOptions(queue: string): RmqOptions {
		const RABBITMQ_URI = this.configService.get("RABBITMQ_URI");

		return {
			transport: Transport.RMQ,
			options: {
				urls: [RABBITMQ_URI],
				/*
					When consumer takes the message from the message broker he can acknowledge it (ack) such as TCP works.
					Default: RabbitMQ automatically acknowledge things.
					Set noAck to false because we want to acknowledge things manually.
				*/
				noAck: false,
				queue: queue,
				queueOptions: {
					// Data associated with Message Broker won't be lost between restarts.
					durable: true
				}
			}
		};
	}

	/** Acknowledge that message was received successfully from queue by consumer. */
	acknowledgeMessage(context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();
		channel.ack(message);
	}
}
