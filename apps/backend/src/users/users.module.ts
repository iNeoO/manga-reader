import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../services/prisma.service";
import { UserController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
	controllers: [UserController],
	providers: [UsersService, PrismaService, AuthGuard],
	exports: [UsersService],
})
export class UsersModule {}
