import { Controller, Get, Param, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ChaptersService } from "./chapters.service";

@Controller("chapters")
export class ChaptersController {
	constructor(private chaptersService: ChaptersService) {}

	@UseGuards(AuthGuard)
	@Get(":mangaName/:chapterNumber")
	findOne(
		@Param("mangaName") mangaName: string,
		@Param("chapterNumber") chapterNumber: string,
		@Request() req,
	) {
		return this.chaptersService.getChapterByMangaNameAndNumber(
			req.user.userId,
			mangaName,
			Number.parseInt(chapterNumber, 10),
		);
	}
}
