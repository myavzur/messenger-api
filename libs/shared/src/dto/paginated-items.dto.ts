// item.dto.ts
import { Expose } from "class-transformer";

export class PaginatedItemsDto {
	@Expose()
	currentPage: number;

	@Expose()
	totalPages: number;

	@Expose()
	totalItems: number;
}
