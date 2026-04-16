import { Module } from "@nestjs/common";
import { PrismaService } from "..//services/prisma.service";
import { ChaptersController } from "./chapters.controller";
import { ChaptersService } from "./chapters.service";

@Module({
	imports: [],
	controllers: [ChaptersController],
	providers: [ChaptersService, PrismaService],
	exports: [ChaptersService],
})
export class ChapterModule {}
