// item.dto.ts
import { Expose } from "class-transformer";

export class Pagination {
	page: number;
	limit: number;
}

export class Paginated {
	@Expose()
	currentPage: number;

	@Expose()
	totalPages: number;

	@Expose()
	totalItems: number;
}
