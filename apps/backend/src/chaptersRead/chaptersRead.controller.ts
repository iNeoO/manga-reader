import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Request,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";

import { ChaptersService } from "../chapters/chapters.service";
import { CreateChapterReadDto } from "./chaptersRead.dto";
import { ChaptersReadService } from "./chaptersRead.service";

@Controller("chapters-read")
export class ChaptersReadController {
	constructor(
		private chaptersReadService: ChaptersReadService,
		private chaptersService: ChaptersService,
	) {}

	@UseGuards(AuthGuard)
	@Get()
	async getAll(@Request() req) {
		return this.chaptersReadService.getAllChaptersRead(req.user.userId);
	}

	@UseGuards(AuthGuard)
	@Post()
	async create(
		@Request() req,
		@Body() createChapterReadDto: CreateChapterReadDto,
	) {
		await this.chaptersReadService.postChapterRead(
			createChapterReadDto.chapterId,
			createChapterReadDto.lastPageReadId,
			req.user.userId,
			createChapterReadDto.isRead,
		);

		return this.chaptersService.getChapter(req.user.userId, {
			id: createChapterReadDto.chapterId,
		});
	}

	@UseGuards(AuthGuard)
	@Delete(":id")
	async delete(@Request() req, @Param("id") chapterId: string) {
		return await this.chaptersReadService.deleteChapterRead(
			chapterId,
			req.user.userId,
		);
	}
}
