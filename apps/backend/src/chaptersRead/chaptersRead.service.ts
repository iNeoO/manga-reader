import { Prisma } from "@manga-reader/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

@Injectable()
export class ChaptersReadService {
	constructor(private prisma: PrismaService) {}

	async getAllChaptersRead(userId: string) {
		const chaptersRead = await this.prisma.chapterRead.findMany({
			where: {
				userId,
			},
			select: {
				isRead: true,
				createdAt: true,
				updatedAt: true,
				page: {
					select: {
						name: true,
						number: true,
						id: true,
					},
				},
				chapter: {
					include: {
						manga: {
							select: {
								id: true,
								name: true,
							},
						},
						_count: {
							select: {
								pages: true,
							},
						},
					},
				},
			},
		});
		return chaptersRead.map((chapterRead) => ({
			isRead: chapterRead.isRead,
			createdAt: chapterRead.createdAt,
			updatedAt: chapterRead.updatedAt,
			page: chapterRead.page,
			chapter: {
				id: chapterRead.chapter.id,
				name: chapterRead.chapter.name,
				number: chapterRead.chapter.number,
				nbPages: chapterRead.chapter._count.pages,
			},
			manga: {
				id: chapterRead.chapter.manga.id,
				name: chapterRead.chapter.manga.name,
			},
		}));
	}

	async postChapterRead(
		chapterId: string,
		lastPageReadId: string,
		userId: string,
		isRead: boolean,
	) {
		try {
			const chapterRead = await this.prisma.chapterRead.upsert({
				where: {
					userId_chapterId: {
						userId,
						chapterId,
					},
				},
				update: {
					isRead,
					chapterId,
					lastPageReadId,
				},
				create: {
					isRead,
					userId,
					chapterId,
					lastPageReadId,
				},
			});
			return chapterRead;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return this.prisma.chapterRead.findUnique({
					where: {
						userId_chapterId: {
							userId,
							chapterId,
						},
					},
				});
			}
			throw error;
		}
	}
	async deleteChapterRead(chapterId: string, userId: string) {
		try {
			const result = await this.prisma.chapterRead.delete({
				where: {
					userId_chapterId: {
						userId,
						chapterId,
					},
				},
			});
			return result;
		} catch (error) {
			throw new NotFoundException("ChapterRead not found.");
		}
	}
}
