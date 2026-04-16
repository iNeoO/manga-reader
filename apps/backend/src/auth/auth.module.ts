import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { env } from "../env";
import { UsersModule } from "../users/users.module";
import { jwtConstants } from "./auth.constant";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
	imports: [
		UsersModule,
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: `${env.VITE_COOKIE_TOKEN_DURATION}d` },
		}),
	],
	providers: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
