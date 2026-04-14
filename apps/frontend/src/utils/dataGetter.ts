import { useMangaStore } from "@/stores/mangaStore";

export const checkManga = async (mangaName: string) => {
	const mangaStore = useMangaStore();
	return mangaStore.getManga(mangaName);
};

export const checkChapter = async (
	mangaName: string,
	chapterNumber: number,
) => {
	const mangaStore = useMangaStore();
	await checkManga(mangaName);
	return mangaStore.getChapter(`${mangaName}/${chapterNumber}`);
};

export const checkPage = async (
	mangaName: string,
	chapterNumber: number,
	_pageNumber: number,
) => {
	return checkChapter(mangaName, chapterNumber);
};
