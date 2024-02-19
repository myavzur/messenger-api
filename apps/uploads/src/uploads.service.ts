import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

import { AttachmentTag, User } from "@app/shared/entities";

import {
	FlushUnusedAttachmentsPayload,
	IConfirmMessageAttachmentsPayload,
	SaveFileResponse
} from "./interfaces";
import { AttachmentService } from "./services";

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
	constructor(private readonly attachmentService: AttachmentService) {}

	logger: Logger = new Logger(UploadsService.name);

	// * Message Attachments
	async uploadMessageAttachment(
		creatorId: User["id"],
		file: Express.Multer.File,
		tag: AttachmentTag = AttachmentTag.FILE
	) {
		const saveFileResult = await this.saveFile(file, tag);
		const attachmentId = await this.attachmentService.saveMessageAttachment({
			...saveFileResult,
			creatorId,
			tag
		});

		return { attachment_id: attachmentId };
	}

	async confirmMessageAttachments(payload: IConfirmMessageAttachmentsPayload) {
		await this.attachmentService.confirmMessageAttachments(payload);
	}

	async flushUnusedAttachments(payload: FlushUnusedAttachmentsPayload) {
		const unusedFiles = await this.attachmentService.getUnusedAttachments({
			userId: payload.userId
		});

		if (!unusedFiles || unusedFiles.length === 0) {
			this.logger.debug("flushUnusedAttachments: Nothing to flush. Good!");
			return;
		}

		this.logger.debug("flushUnusedAttachments: Flushing...");
		await Promise.all(
			unusedFiles.map(file => {
				const filePath = path.join(__dirname, "..", "public", file.fileUrl);
				this.deleteFile(filePath);
			})
		);
		this.logger.debug("Files deleted from Disk!");

		await this.attachmentService.forgotUnusedFiles({
			unusedFileIds: unusedFiles.map(file => file.id),
			userId: payload.userId
		});
	}

	// * Avatars
	async uploadAvatar(creatorId: User["id"], file: Express.Multer.File) {
		if (!allowedAvatarTypes.includes(file.mimetype)) {
			throw new BadRequestException(
				"Invalid file type. Allowed file types: " + allowedAvatarTypes.join(", ")
			);
		}

		const saveFileResult = await this.saveFile(file, "avatars");
		const attachmentId = await this.attachmentService.updateAvatar({
			...saveFileResult,
			creatorId
		});

		return { attachment_id: attachmentId };
	}

	// * Private
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

		this.logger.debug(`saveFile: Saved file ${file.originalname}`);

		return {
			fileName: Buffer.from(file.originalname, "latin1").toString("utf8"),
			fileSize: file.size,
			fileType: file.mimetype,
			fileUrl: `/${outputFolder}/${outputName}`
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
	private async writeFile(path: fs.PathLike, buffer: Buffer): Promise<void> {
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

	private async deleteFile(path: fs.PathLike) {
		try {
			await fs.promises.unlink(path);
		} catch (e) {
			this.logger.error("deleteFile: Failed to delete file!");
			this.logger.error(e);
		}
	}

	/** Create directory if it's not exists. */
	private async ensureDir(path: fs.PathLike) {
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
