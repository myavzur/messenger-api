import { Test, TestingModule } from "@nestjs/testing";

import { MeetController } from "./meet.controller";
import { MeetService } from "./meet.service";

describe("MeetController", () => {
	let meetController: MeetController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [MeetController],
			providers: [MeetService]
		}).compile();

		meetController = app.get<MeetController>(MeetController);
	});

	describe("root", () => {
		it('should return "Hello World!"', () => {
			expect(meetController.getHello()).toBe("Hello World!");
		});
	});
});
