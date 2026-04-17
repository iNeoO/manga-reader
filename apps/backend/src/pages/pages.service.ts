import type { Page, Prisma } from "@manga-reader/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

type PageStoragePayload = {
	page: Page;
	mangaId: string;
	objectKey: string;
};

@Injectable()
export class PagesService {
	constructor(private prisma: PrismaService) {}

	async getPage(
		pageWhereUniqueInput: Prisma.PageWhereUniqueInput,
	): Promise<Page> {
		const page = await this.prisma.page.findUnique({
			where: pageWhereUniqueInput,
		});

		if (!page) {
			throw new NotFoundException("Page not found.");
		}
		return page;
	}

	async getPageStoragePayload(
		pageWhereUniqueInput: Prisma.PageWhereUniqueInput,
	): Promise<PageStoragePayload> {
		const page = await this.prisma.page.findUnique({
			where: pageWhereUniqueInput,
			include: {
				chapter: {
					select: {
						mangaId: true,
					},
				},
			},
		});

		if (!page) {
			throw new NotFoundException("Page not found.");
		}

		return {
			page,
			mangaId: page.chapter.mangaId,
			objectKey: `${page.chapter.mangaId}/${page.id}`,
		};
	}
}
