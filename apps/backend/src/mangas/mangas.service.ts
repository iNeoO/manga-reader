import type { Manga, Prisma } from "@manga-reader/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "../logging/app-logger.service";
import { PrismaService } from "../services/prisma.service";
import { S3Service } from "../s3/s3.service";

type DeleteMangaResult = {
	chapterCount: number;
	id: string;
	name: string;
	pageCount: number;
};

@Injectable()
export class MangasService {
	constructor(
		private prisma: PrismaService,
		private readonly s3Service: S3Service,
		private readonly logger: AppLogger,
	) {}

	async getMangas(): Promise<Manga[]> {
		return await this.prisma.manga.findMany({
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
		const manga = await this.prisma.manga.findUnique({
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

	async getMangaByName(name: string, userId: string) {
		return this.getManga({ name }, userId);
	}

	async deleteMangaByName(name: string): Promise<DeleteMangaResult> {
		const manga = await this.prisma.manga.findUnique({
			where: {
				name,
			},
			select: {
				id: true,
				name: true,
				chapters: {
					select: {
						id: true,
						pages: {
							select: {
								id: true,
								path: true,
							},
						},
					},
				},
			},
		});

		if (!manga) {
			throw new NotFoundException("Manga not found.");
		}

		const chapterIds = manga.chapters.map((chapter) => chapter.id);
		const pages = manga.chapters.flatMap((chapter) => chapter.pages);
		const pageIds = pages.map((page) => page.id);

		await this.prisma.$transaction(async (tx) => {
			if (chapterIds.length > 0) {
				await tx.chapterRead.deleteMany({
					where: {
						chapterId: {
							in: chapterIds,
						},
					},
				});

				await tx.chapter.updateMany({
					where: {
						id: {
							in: chapterIds,
						},
					},
					data: {
						coverPageId: null,
					},
				});
			}

			await tx.manga.update({
				where: {
					id: manga.id,
				},
				data: {
					coverPageId: null,
				},
			});

			if (pageIds.length > 0) {
				await tx.page.deleteMany({
					where: {
						id: {
							in: pageIds,
						},
					},
				});
			}

			if (chapterIds.length > 0) {
				await tx.chapter.deleteMany({
					where: {
						id: {
							in: chapterIds,
						},
					},
				});
			}

			await tx.manga.delete({
				where: {
					id: manga.id,
				},
			});
		});

		await this.cleanupMangaStorage(manga.id, pages.map((page) => page.path));

		this.logger.pino.info(
			{
				context: MangasService.name,
				chapterCount: chapterIds.length,
				mangaId: manga.id,
				mangaName: manga.name,
				pageCount: pageIds.length,
			},
			"manga_deleted",
		);

		return {
			id: manga.id,
			name: manga.name,
			chapterCount: chapterIds.length,
			pageCount: pageIds.length,
		};
	}

	private async cleanupMangaStorage(mangaId: string, objectKeys: string[]) {
		const uniqueKeys = [...new Set([...objectKeys, `${mangaId}/`])];

		const results = await Promise.allSettled(
			uniqueKeys.map(async (key) => {
				await this.s3Service.deleteObject(key);
			}),
		);

		const failedKeys = results.flatMap((result, index) =>
			result.status === "rejected" ? [uniqueKeys[index]] : [],
		);

		if (failedKeys.length === 0) {
			return;
		}

		this.logger.pino.warn(
			{
				context: MangasService.name,
				failedKeys,
				mangaId,
			},
			"manga_storage_cleanup_partial_failure",
		);
	}
}
