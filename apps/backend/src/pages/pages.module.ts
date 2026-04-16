import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { S3Module } from "../s3/s3.module";
import { PrismaService } from "../services/prisma.service";
import { PagesController } from "./pages.controller";
import { PagesService } from "./pages.service";

@Module({
	imports: [S3Module],
	controllers: [PagesController],
	providers: [PagesService, PrismaService, AuthGuard],
})
export class PagesModule {}
