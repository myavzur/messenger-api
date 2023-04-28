import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
	@IsEmail({}, { message: "Email isn't valid." })
	@MaxLength(60, { message: "Email couldn't be larger than 60 symbols!" })
	email: string;

	@IsString({ message: "Password must be a string! What a mess." })
	@MinLength(8, { message: 'Password cant"t be less than 8 symbols.' })
	@MaxLength(80, { message: `Password can't be larger than 80 symbols!` })
	password: string;
}
