import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Request,
	UseGuards,
} from "@nestjs/common";
import type { MultipartFile } from "@fastify/multipart";
import { AuthGuard } from "../auth/auth.guard";
import { MangaImportService } from "./mangaImport.service";
import { MangasService } from "./mangas.service";

type MultipartRequest = {
	file: () => Promise<MultipartFile | undefined>;
};

@Controller("mangas")
export class MangasController {
	constructor(
		private mangasService: MangasService,
		private mangaImportService: MangaImportService,
	) {}

	@UseGuards(AuthGuard)
	@Get()
	find() {
		return this.mangasService.getMangas();
	}

	@UseGuards(AuthGuard)
	@Get(":name")
	findOne(@Param("name") name: string, @Request() req) {
		return this.mangasService.getMangaByName(name, req.user.userId);
	}

	@UseGuards(AuthGuard)
	@Delete(":name")
	remove(@Param("name") name: string) {
		return this.mangasService.deleteMangaByName(name);
	}

	@UseGuards(AuthGuard)
	@Post("import")
	async import(@Request() request: MultipartRequest) {
		const file = await request.file();
		if (!file) {
			throw new BadRequestException("ZIP file is required.");
		}

		return this.mangaImportService.importZip(file);
	}
}
