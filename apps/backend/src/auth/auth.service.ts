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
		const user = await this.usersService.getUserByEmail(email);
		console.log(user);
		console.log('user');
		if (!user) {
			throw new UnauthorizedException();
		}

		const isPasswordValid = await argon2.verify(user.password, pass);
		console.log(isPasswordValid);
		if (!isPasswordValid) {
			throw new UnauthorizedException();
		}

		const payload = { sub: user.id, userId: user.id, username: user.username };
		return {
			access_token: await this.jwtService.signAsync(payload),
		};
	}
}
