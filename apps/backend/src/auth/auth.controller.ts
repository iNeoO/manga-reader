import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { SingInDto } from "./auth.type";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post("login")
	signIn(@Body() signInDto: SingInDto) {
		return this.authService.signIn(signInDto.email, signInDto.password);
	}
}
