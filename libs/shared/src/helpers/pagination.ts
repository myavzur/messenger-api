export const getPage = (page: number) => (page >= 1 ? page : 1);
export const getLimit = (limit: number, maxLimit: number) =>
	limit <= maxLimit ? limit : maxLimit;
