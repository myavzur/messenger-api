import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { Repository } from "typeorm";

import { Attachment, AttachmentTag, User } from "@app/shared/entities";

import { SaveFileResponse } from "./interfaces";

const allowedAttachmentTypes = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"video/mp4",
	"video/x-m4v",
	"video/quicktime"
];
const allowedAvatarTypes = ["image/png", "image/jpeg"];

@Injectable()
export class UploadsService {
	constructor(
		@InjectRepository(Attachment)
		private readonly attachmentRepository: Repository<Attachment>
	) {}
	logger: Logger = new Logger(UploadsService.name);

	async uploadMessageAttachment(
		creatorId: User["id"],
		file: Express.Multer.File,
		tag: AttachmentTag = AttachmentTag.FILE
	) {
		if (!allowedAttachmentTypes.includes(file.mimetype)) {
			throw new BadRequestException(
				"Invalid file type. Allowed file types: " + allowedAttachmentTypes.join(", ")
			);
		}

		const saveResult = await this.saveFile(file, tag);
		const insertResult = await this.attachmentRepository.insert({
			file_name: saveResult.file_name,
			file_size: saveResult.file_size,
			file_type: saveResult.file_type,
			file_url: saveResult.file_url,
			tag,
			user: { id: creatorId }
		});
		return {
			attachment_id: insertResult.raw[0].id,
			attachment_type: insertResult.raw[0].tag
		};
	}

	async uploadAvatar(creatorId: User["id"], file: Express.Multer.File) {
		if (!allowedAvatarTypes.includes(file.mimetype)) {
			throw new BadRequestException(
				"Invalid file type. Allowed file types: " + allowedAvatarTypes.join(", ")
			);
		}

		const saveResult = await this.saveFile(file, "avatars");
		const insertResult = await this.attachmentRepository.insert({
			file_name: saveResult.file_name,
			file_size: saveResult.file_size,
			file_type: saveResult.file_type,
			file_url: saveResult.file_url,
			tag: AttachmentTag.AVATAR,
			user: { id: creatorId }
		});
		return {
			attachment_id: insertResult.raw[0].id,
			attachment_type: insertResult.raw[0].tag
		};
	}

	private async saveFile(
		file: Express.Multer.File,
		folder: string
	): Promise<SaveFileResponse> {
		const outputFolder = `uploads/${folder}`;

		const outputName = await this.generateFileName(file);
		const outputDir = path.join(__dirname, "..", "public", outputFolder);
		const outputFile = path.join(outputDir, outputName);

		await this.ensureDir(outputDir);
		await this.writeFile(outputFile, file.buffer);

		return {
			file_name: Buffer.from(file.originalname, "latin1").toString("utf8"),
			file_size: file.size,
			file_type: file.mimetype,
			file_url: `/${outputFolder}/${outputName}`,
			output_file_name: outputName
		};
	}

	/** Generate file name. */
	private async generateFileName(file: Express.Multer.File): Promise<string> {
		return new Promise((resolve, reject) => {
			const timestamp = new Date().getTime();
			const randomString = crypto.randomBytes(8).toString("hex");

			resolve(`${timestamp}-${randomString}` + path.extname(file.originalname));
		});
	}

	/** Write file on disk by specified directory. */
	private async writeFile(path: string, buffer: Buffer): Promise<void> {
		return new Promise((resolve, reject) => {
			const writeStream = fs.createWriteStream(path);

			writeStream.on("error", reject);
			writeStream.on("finish", resolve);

			const readable = new Readable();
			// Overwrite default _read method;
			readable._read = () => null;
			readable.push(buffer);
			readable.push(null);

			readable.pipe(writeStream);
		});
	}

	/** Create directory if it's not exists. */
	private async ensureDir(path: string) {
		try {
			await fs.promises.access(path);
		} catch (err) {
			if (err.code === "ENOENT") {
				return await fs.promises.mkdir(path, { recursive: true });
			}

			throw err;
		}
	}
}
