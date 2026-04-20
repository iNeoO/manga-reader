import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "..//services/prisma.service";
import { ChaptersController } from "./chapters.controller";
import { ChaptersService } from "./chapters.service";

@Module({
	imports: [],
	controllers: [ChaptersController],
	providers: [ChaptersService, PrismaService, AuthGuard],
	exports: [ChaptersService],
})
export class ChapterModule {}
