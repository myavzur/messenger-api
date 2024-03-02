import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

import { File, User } from "@app/shared/entities";

import { FileService } from "./services";
import { ConfirmFilesAttachedPayload } from "./services/file.service.interface";
import {
	IUploadsService,
	SaveFileResult,
	UploadAvatarPayload,
	UploadFileResult,
	UploadMessageAttachmentPayload
} from "./uploads.service.interface";

const allowedAvatarTypes = ["image/png", "image/jpeg", "image/gif"];

@Injectable()
export class UploadsService implements IUploadsService {
	constructor(private readonly fileService: FileService) {}

	logger: Logger = new Logger(UploadsService.name);

	// * Message Files
	async uploadMessageAttachment(
		payload: UploadMessageAttachmentPayload
	): Promise<UploadFileResult> {
		const saveFileResult = await this.saveFile(payload.file, payload.tag);

		const fileId = await this.fileService.createMessageAttachment({
			...saveFileResult,
			userId: payload.userId,
			tag: payload.tag
		});

		return { file_id: fileId };
	}

	async confirmFilesAttached(payload: ConfirmFilesAttachedPayload): Promise<void> {
		await this.fileService.confirmFilesAttached(payload);
	}

	async deleteUnusedFiles(payload: User["id"]): Promise<void> {
		const unusedFiles = await this.fileService.getUnusedFiles({
			userId: payload
		});

		if (!unusedFiles || unusedFiles.length === 0) {
			this.logger.debug("deleteUnusedFiles: Nothing to delete. Good!");
			return;
		}

		this.logger.debug("deleteUnusedFiles: Deleting...");
		await Promise.all(
			unusedFiles.map(file => {
				const filePath = path.join(__dirname, "..", "public", file.fileUrl);
				this.deleteFile(filePath);
			})
		);
		this.logger.debug("Files deleted from Disk!");

		await this.fileService.deleteFiles({
			fileIds: unusedFiles.map(file => file.id),
			userId: payload
		});
	}

	// * Avatars
	async uploadAvatar(payload: UploadAvatarPayload): Promise<UploadFileResult> {
		if (!allowedAvatarTypes.includes(payload.file.mimetype)) {
			throw new BadRequestException(
				"Invalid file type. Allowed file types: " + allowedAvatarTypes.join(", ")
			);
		}

		const saveFileResult = await this.saveFile(payload.file, "avatars");
		const fileId = await this.fileService.createAvatar({
			...saveFileResult,
			userId: payload.userId
		});

		return { file_id: fileId };
	}

	async getAvatars(payload: User["id"]): Promise<File[]> {
		return await this.fileService.getAvatars(payload);
	}

	// * Private
	private async saveFile(
		file: Express.Multer.File,
		folder: string
	): Promise<SaveFileResult> {
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
