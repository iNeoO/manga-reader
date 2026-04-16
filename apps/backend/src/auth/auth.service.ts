import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import argon2 from "argon2";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private jwtService: JwtService,
	) {}

	async signIn(email: string, pass: string) {
		const hash = await argon2.hash(pass);
		const user = await this.usersService.getUser({ email, password: hash });
		if (!user) {
			throw new UnauthorizedException();
		}

		const payload = { sub: user.id, username: user.username };
		return {
			access_token: await this.jwtService.signAsync(payload),
		};
	}
}
