/** Ф-ция убеждается в том, что параметр `page` больше либо равен 1. */
export const getPage = (page: number) => (page >= 1 ? page : 1);

/** Ф-ция убеждается в том, что параметр `limit` меньше либо равен `maxLimit`. */
export const getLimit = (limit: number, maxLimit: number) =>
	limit <= maxLimit ? limit : maxLimit;
