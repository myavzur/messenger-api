import { FindManyOptions } from "typeorm";

export interface IBaseRepository<T> {
	findAll(options?: FindManyOptions<T>): Promise<T[]>;
	findOneById(id: number | string): Promise<T>;
}
