import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";

@Injectable()
export class RedisService {
	constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

	logger: Logger = new Logger(RedisService.name);

	async get(key: string) {
		this.logger.debug(`GET ${key} from REDIS`);
		return await this.cache.get(key);
	}

	async set(key: string, value: unknown, ttl = 0) {
		this.logger.debug(`SET ${key} to REDIS`);
		await this.cache.set(key, value, ttl);
	}

	async delete(key: string) {
		this.logger.debug(`DELETE ${key} from REDIS`);
		await this.cache.del(key);
	}

	async reset() {
		await this.cache.reset();
	}
}
