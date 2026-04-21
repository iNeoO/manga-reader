import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import argon2 from "argon2";
import { AppLogger } from "../logging/app-logger.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private jwtService: JwtService,
		private readonly logger: AppLogger,
	) {}

	async signIn(email: string, pass: string) {
		const user = await this.usersService.getUserByEmail(email);
		if (!user) {
			this.logger.pino.warn(
				{
					context: AuthService.name,
					reason: "user_not_found",
				},
				"auth_login_failed",
			);
			throw new UnauthorizedException();
		}

		const isPasswordValid = await argon2.verify(user.password, pass);
		if (!isPasswordValid) {
			this.logger.pino.warn(
				{
					context: AuthService.name,
					reason: "invalid_password",
					userId: user.id,
				},
				"auth_login_failed",
			);
			throw new UnauthorizedException();
		}

		const payload = { sub: user.id, userId: user.id, username: user.username };
		this.logger.pino.info(
			{
				context: AuthService.name,
				userId: user.id,
				username: user.username,
			},
			"auth_login_succeeded",
		);
		return {
			access_token: await this.jwtService.signAsync(payload),
		};
	}
}
