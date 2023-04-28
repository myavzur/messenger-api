import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";

import { RabbitMQService } from "@app/rabbitmq";
import { User } from "@app/shared/entities";

import { PresenceService } from "./presence.service";

@Controller()
export class PresenceController {
	constructor(
		private readonly presenceService: PresenceService,
		private readonly rabbitmqService: RabbitMQService
	) {}

	@MessagePattern({ cmd: "get-connected-user-by-id" })
	async getConnectedUserById(
		@Ctx() context: RmqContext,
		@Payload() payload: { id: User["id"] }
	): Promise<any> {
		this.rabbitmqService.acknowledgeMessage(context);

		return await this.presenceService.getConnectedUserById(payload.id);
	}
}
