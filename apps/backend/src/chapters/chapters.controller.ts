import { Controller, Get, Param, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ChaptersService } from "./chapters.service";

@Controller("chapters")
export class ChaptersController {
	constructor(private chaptersService: ChaptersService) {}

	@UseGuards(AuthGuard)
	@Get(":id")
	findOne(@Param("id") id: string, @Request() req) {
		return this.chaptersService.getChapter(req.user.userId, { id });
	}
}
