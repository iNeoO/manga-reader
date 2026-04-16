import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../services/prisma.service";
import { S3Module } from "../s3/s3.module";
import { MangasController } from "./mangas.controller";
import { MangaImportService } from "./mangaImport.service";
import { MangasService } from "./mangas.service";

@Module({
	imports: [S3Module],
	controllers: [MangasController],
	providers: [MangasService, MangaImportService, PrismaService, AuthGuard],
})
export class MangasModule {}
