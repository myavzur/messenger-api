const getZeroes = (num: number, zeroesLength = 2) =>
	String(num).padStart(zeroesLength, "0");

/** Returns current time string without timezone.
 * @example const date = getCurrentTimeFormatted(); // 2024-01-23 20:24:22.916968
 */
export const getCurrentTimeFormatted = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = getZeroes(now.getMonth() + 1);
	const day = getZeroes(now.getDate());
	const hours = getZeroes(now.getHours());
	const minutes = getZeroes(now.getMinutes());
	const seconds = getZeroes(now.getSeconds());
	const milliseconds = getZeroes(now.getMilliseconds(), 6);

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};
