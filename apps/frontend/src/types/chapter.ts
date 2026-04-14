import type { Chapter, Manga, Page } from "./manga";

export type ChapterFormated = Chapter & {
	manga?: Manga;
	pages: Page[];
};
