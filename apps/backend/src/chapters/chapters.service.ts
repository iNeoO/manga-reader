import type { Prisma } from "@manga-reader/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

@Injectable()
export class ChaptersService {
	constructor(private prisma: PrismaService) {}

	async getChapter(
		userId: string,
		chapterWhereUniqueInput: Prisma.ChapterWhereUniqueInput,
	) {
		const chapter = await this.prisma.client.chapter.findUnique({
			where: chapterWhereUniqueInput,
			select: {
				id: true,
				name: true,
				number: true,
				coverPageId: true,
				chaptersRead: {
					where: {
						userId,
					},
					select: {
						isRead: true,
						lastPageReadId: true,
					},
				},
				pages: {
					select: {
						id: true,
						name: true,
						number: true,
					},
					orderBy: {
						number: "asc",
					},
				},
			},
		});
		if (!chapter) {
			throw new NotFoundException("Chapter not found.");
		}

		let lastPageFind = !chapter.chaptersRead[0];

		const chapterFormated = {
			id: chapter.id,
			name: chapter.name,
			number: chapter.number,
			coverPageId: chapter.coverPageId,
			isRead: chapter.chaptersRead[0]?.isRead || false,
			lastPageReadId: chapter.chaptersRead[0]?.lastPageReadId || null,
			pages: chapter.pages.map((page) => {
				const isRead = !lastPageFind;
				if (
					!lastPageFind &&
					page.id === chapter.chaptersRead[0]?.lastPageReadId
				) {
					lastPageFind = true;
				}
				const pageFormated = {
					...page,
					isRead,
				};
				return pageFormated;
			}),
		};

		return chapterFormated;
	}
}
