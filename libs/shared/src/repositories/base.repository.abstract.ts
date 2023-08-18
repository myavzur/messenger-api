import { FindManyOptions, FindOptionsWhere, Repository } from "typeorm";

import { IBaseRepository } from "./base.repository.interface";

interface TypeWithId {
	id: number | string;
}

export abstract class BaseRepository<T extends TypeWithId>
	extends Repository<T>
	implements IBaseRepository<T>
{
	async findAll(options?: FindManyOptions<T>): Promise<T[]> {
		return await this.find(options);
	}

	async findOneById(id: any): Promise<T> {
		const options: FindOptionsWhere<T> = { id };
		return await this.findOneBy(options);
	}
}
