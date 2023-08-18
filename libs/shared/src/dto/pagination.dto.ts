// item.dto.ts
import { Expose } from "class-transformer";

export class Paginatable {
	page: number;
	limit: number;
}

export class PaginatedDto {
	@Expose()
	currentPage: number;

	@Expose()
	totalPages: number;

	@Expose()
	totalItems: number;
}
