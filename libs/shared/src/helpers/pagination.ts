/** Ф-ция убеждается в том, что параметр `page` больше либо равен 1. */
export const getPage = (page: number) => (page >= 1 ? page : 1);

/** Ф-ция убеждается в том, что параметр `limit` меньше либо равен `maxLimit`.
 * maxLimit - Значение указанное сервером, которое ограничивает максимальный лимит выборки
 * если клиент слишком ахуевший и попросил limit = 3000
 */
export const getLimit = (limit: number, maxLimit: number) =>
	Math.min(limit, maxLimit);

export const getTotalPages = (totalItems: number, limit: number) =>
	Math.ceil(totalItems / limit);
