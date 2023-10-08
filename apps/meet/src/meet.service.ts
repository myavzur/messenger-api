import { Injectable } from "@nestjs/common";
import { AccessToken, Room, RoomServiceClient } from "livekit-server-sdk";

const roomService = new RoomServiceClient(
	process.env.LIVEKIT_HOST_URI,
	process.env.LIVEKIT_API_KEY,
	process.env.APP_SECRET_KEY
);

@Injectable()
export class MeetService {
	generateAccessToken(roomName: Room["name"]) {
		const access_token = new AccessToken(
			process.env.LIVEKIT_API_KEY,
			process.env.APP_SECRET_KEY,
			{ identity: "Пидорашка" }
		);
		access_token.addGrant({ roomJoin: true, room: roomName });

		return access_token.toJwt();
	}

	async createRoom(roomName: Room["name"]) {
		return await roomService.createRoom({
			name: roomName,
			emptyTimeout: 5 * 60 // 5 minutes
		});
	}

	async deleteRoom(roomName: Room["name"]) {
		return await roomService.deleteRoom(roomName);
	}

	async getRooms() {
		return await roomService.listRooms();
	}
}
