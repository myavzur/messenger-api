import * as bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
	return await bcrypt.hash(password, 6);
};
