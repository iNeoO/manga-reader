import { Module } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import { ChaptersReadController } from "./chaptersRead.controller";
import { ChaptersReadService } from "./chaptersRead.service";

@Module({
	imports: [],
	controllers: [ChaptersReadController],
	providers: [ChaptersReadService, PrismaService],
})
export class ChaptersReadModule {}
