export type Page = {
	id: string;
	name: string;
	path: string;
	number: number;
	isRead?: boolean;
	[key: string]: unknown;
};

export type Manga = {
	id: string;
	name: string;
	coverPageId?: string | null;
	coverPage?: Page | null;
	_count?: {
		chapters?: number;
	};
	[key: string]: unknown;
};

export type Chapter = {
	id: string;
	name: string;
	number: number;
	mangaId: string;
	isRead?: boolean;
	count?: number;
	nbPages?: number;
	countPagesRead?: number;
	lastPageReadId?: string | null;
	pages?: Page[];
	coverPageId?: string | null;
	coverPage?: Page | null;
	[key: string]: unknown;
};

export type MangaWithChapters = Manga & {
	chapters: Chapter[];
};
