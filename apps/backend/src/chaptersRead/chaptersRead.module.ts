import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ChapterModule } from "../chapters/chapters.module";
import { PrismaService } from "../services/prisma.service";
import { ChaptersReadController } from "./chaptersRead.controller";
import { ChaptersReadService } from "./chaptersRead.service";

@Module({
	imports: [ChapterModule],
	controllers: [ChaptersReadController],
	providers: [ChaptersReadService, PrismaService, AuthGuard],
})
export class ChaptersReadModule {}
