import type { Manga, Prisma } from "@manga-reader/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

@Injectable()
export class MangasService {
	constructor(private prisma: PrismaService) {}

	async getMangas(): Promise<Manga[]> {
		return await this.prisma.client.manga.findMany({
			include: {
				_count: {
					select: {
						chapters: true,
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});
	}

	async getManga(
		mangaWhereUniqueInput: Prisma.MangaWhereUniqueInput,
		userId: string,
	) {
		const manga = await this.prisma.client.manga.findUnique({
			where: mangaWhereUniqueInput,
			select: {
				id: true,
				name: true,
				coverPageId: true,
				chapters: {
					include: {
						_count: {
							select: {
								pages: true,
							},
						},
						chaptersRead: {
							where: {
								userId,
							},
							select: {
								isRead: true,
								lastPageReadId: true,
								createdAt: true,
								updatedAt: true,
							},
						},
						pages: {
							select: {
								id: true,
							},
						},
					},
					orderBy: {
						number: "desc",
					},
				},
			},
		});

		if (!manga) {
			throw new NotFoundException("Manga not found.");
		}

		const countPagesRead = (
			pages: { id: string }[],
			lastPageReadId: string | null,
		) => {
			if (!lastPageReadId) {
				return 0;
			}

			const lastPageRead = pages.findIndex(
				(page) => page.id === lastPageReadId,
			);
			if (lastPageRead === -1) {
				return 0;
			}

			return lastPageRead + 1;
		};

		const mangaFormated = {
			...manga,
			chapters: manga.chapters.map((chapter) => {
				const chapterFormated = {
					id: chapter.id,
					name: chapter.name,
					number: chapter.number,
					count: chapter._count.pages,
					coverPageId: chapter.coverPageId,
					isRead: chapter.chaptersRead[0]?.isRead || false,
					lastPageReadId: chapter.chaptersRead[0]?.lastPageReadId || null,
					countPagesRead: countPagesRead(
						chapter.pages,
						chapter.chaptersRead[0]?.lastPageReadId,
					),
				};
				return chapterFormated;
			}),
		};

		return mangaFormated;
	}
}
