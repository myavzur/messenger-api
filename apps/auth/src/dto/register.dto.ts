import {
	IsEmail,
	IsOptional,
	IsString,
	MaxLength,
	MinLength
} from "class-validator";

export class RegisterDto {
	@IsEmail({}, { message: "Email isn't valid." })
	@MaxLength(60, { message: "Email couldn't be larger than 60 symbols!" })
	email: string;

	@IsOptional()
	@IsString({ message: "Login must be a string!" })
	@MinLength(2, { message: 'Login cant"t be less than 2 symbols.' })
	@MaxLength(30, { message: `Name can't be larger than 30 symbols!` })
	account_name: string;

	@IsString({ message: "Password must be a string! What a mess." })
	@MinLength(8, { message: 'Password cant"t be less than 8 symbols.' })
	@MaxLength(80, { message: `Password can't be larger than 80 symbols!` })
	password: string;

	@IsString({ message: "Password confirmation must be a string! What a mess." })
	password_confirmation: string;
}
