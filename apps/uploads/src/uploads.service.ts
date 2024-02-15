import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

import { SaveFileResponse, UploadFolders } from "./interfaces";

@Injectable()
export class UploadsService {
	logger: Logger = new Logger(UploadsService.name);

	async saveFile(
		file: Express.Multer.File,
		folder?: UploadFolders
	): Promise<SaveFileResponse> {
		const outputFolder = folder ? `uploads/${folder}` : "uploads";

		const outputName = await this.generateFileName(file);
		const outputDir = path.join(__dirname, "..", "public", outputFolder);
		const outputFile = path.join(outputDir, outputName);

		await this.ensureDir(outputDir);
		await this.writeFile(outputFile, file.buffer);

		// TODO: Fix paths
		this.logger.debug(`[saveFile]: File name: ${outputFile}`);
		this.logger.debug(`[saveFile]: File dir: ${outputFile}`);
		this.logger.debug(`[saveFile]: File path: ${outputFile}`);

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
