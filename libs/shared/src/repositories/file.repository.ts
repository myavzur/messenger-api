import { Injectable, Logger } from "@nestjs/common";
import { DataSource, In } from "typeorm";

import { File } from "../entities";

import { BaseRepositoryAbstract } from "./base.repository.abstract";
import {
	CreateFilePayload,
	DeleteFilesPayload,
	IFilesRepository,
	IUpdateFilesRelationPayload
} from "./file.repository.interface";

@Injectable()
export class FileRepository
	extends BaseRepositoryAbstract<File>
	implements IFilesRepository
{
	constructor(private dataSource: DataSource) {
		super(File, dataSource.createEntityManager());
	}

	logger: Logger = new Logger(FileRepository.name);

	async createFile(payload: CreateFilePayload): Promise<File> {
		const insertResult = await this.insert({
			file_name: payload.fileName,
			file_size: payload.fileSize,
			file_type: payload.fileType,
			file_url: payload.fileUrl,
			tag: payload.tag,
			user: { id: payload.userId }
		});
		const fileId = insertResult.identifiers[0].id;

		return await this.findOne({ where: { id: fileId } });
	}

	async updateFilesRelation(payload: IUpdateFilesRelationPayload): Promise<any> {
		const result = await this.update(
			{
				id: In(payload.fileIds),
				user: { id: payload.userId }
			},
			{
				message: { id: payload.messageId },
				chat: { id: payload.chatId }
			}
		);

		return result;
	}

	async deleteFiles(payload: DeleteFilesPayload): Promise<void> {
		await this.delete({
			id: In(payload.fileIds),
			user: { id: payload.userId }
		});
	}
}
