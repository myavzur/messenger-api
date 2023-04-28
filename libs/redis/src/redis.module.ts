import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
// Not using cache-manager-redis-store because there are typescript issues with the store.
import { redisStore } from "cache-manager-redis-yet";

import { RedisService } from "./redis.service";

@Module({
	imports: [
		CacheModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				store: await redisStore({
					url: configService.get("REDIS_URI")
				})
			}),
			isGlobal: true
		})
	],
	providers: [RedisService],
	exports: [RedisService]
})
export class RedisModule {}
