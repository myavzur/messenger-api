import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";

import { MeetService } from "./meet.service";

@Controller()
export class MeetController {
	constructor(
		private readonly meetService: MeetService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	@MessagePattern({ cmd: "generate-access-token" })
	generateAccessToken(
		@Ctx() context: RmqContext,
		@Payload() payload: { roomName: string }
	) {
		this.rabbitmqService.acknowledgeMessage(context);

		return this.meetService.generateAccessToken(payload.roomName);
	}

	@MessagePattern({ cmd: "create-room" })
	createRoom(@Ctx() context: RmqContext, @Payload() payload: { roomName: string }) {
		this.rabbitmqService.acknowledgeMessage(context);

		return this.meetService.createRoom(payload.roomName);
	}

	@MessagePattern({ cmd: "delete-room" })
	deleteRoom(@Ctx() context: RmqContext, @Payload() payload: { roomName: string }) {
		this.rabbitmqService.acknowledgeMessage(context);

		return this.meetService.deleteRoom(payload.roomName);
	}

	@MessagePattern({ cmd: "get-rooms" })
	getRooms(@Ctx() context: RmqContext) {
		this.rabbitmqService.acknowledgeMessage(context);

		return this.meetService.getRooms();
	}
}
