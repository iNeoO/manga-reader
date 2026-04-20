import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { AppLogger } from "../logging/app-logger.service";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly logger: AppLogger,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			this.logger.warn(
				"auth_token_missing",
				{
					method: request.method,
					path: request.url,
				},
				AuthGuard.name,
			);
			throw new UnauthorizedException();
		}
		try {
			const payload = await this.jwtService.verifyAsync(token);
			request["user"] = payload;
		} catch {
			this.logger.warn(
				"auth_token_invalid",
				{
					method: request.method,
					path: request.url,
				},
				AuthGuard.name,
			);
			throw new UnauthorizedException();
		}
		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? [];
		return type === "Bearer" ? token : undefined;
	}
}
