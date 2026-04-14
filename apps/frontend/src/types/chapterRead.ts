import type { ChapterFormated } from "./chapter";
import type { Manga, Page } from "./manga";

export type ChapterRead = {
	isRead: boolean;
	userId: string;
	chapterId: string;
	lastPageReadId: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	[key: string]: unknown;
};

export type ChapterReadFormated = ChapterRead & {
	manga: Manga;
	chapter: ChapterFormated;
	page: Page;
};

export type PostChapterReadPayload = {
	chapterId: string;
	lastPageReadId: string;
	isRead: boolean;
};
