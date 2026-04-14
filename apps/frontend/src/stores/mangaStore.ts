import got from "got";
import { defineStore } from "pinia";
import { ref } from "vue";

import type { ChapterFormated } from "@/types/chapter";
import type {
	ChapterRead,
	ChapterReadFormated,
	PostChapterReadPayload,
} from "@/types/chapterRead";
import type { Manga, MangaWithChapters } from "@/types/manga";

export const useMangaStore = defineStore("manga", () => {
	const mangas = ref<Manga[]>([]);
	const isMangasLoading = ref(false);
	const manga = ref<MangaWithChapters | null>(null);
	const isMangaLoading = ref(false);
	const chapter = ref<ChapterFormated | null>(null);
	const isChapterLoading = ref(false);
	const chaptersRead = ref<ChapterReadFormated[]>([]);
	const isChaptersReadLoading = ref(false);
	const isPostChapterReadLoading = ref(false);
	const isDeleteChapterReadLoading = ref(false);

	async function getMangas() {
		isMangasLoading.value = true;
		try {
			const data = await got.get("api/mangas/").json<Manga[]>();
			mangas.value = data;
			return data;
		} finally {
			isMangasLoading.value = false;
		}
	}

	async function getManga(payload: string) {
		isMangaLoading.value = true;
		try {
			const data = await got
				.get(`api/mangas/${payload}`)
				.json<MangaWithChapters>();
			manga.value = data;
			return data;
		} finally {
			isMangaLoading.value = false;
		}
	}

	async function getChapter(payload: string) {
		isChapterLoading.value = true;
		try {
			const data = await got
				.get(`api/chapters/${payload}`)
				.json<ChapterFormated>();
			chapter.value = data;
			return data;
		} finally {
			isChapterLoading.value = false;
		}
	}

	async function postChapterReading(payload: PostChapterReadPayload) {
		isPostChapterReadLoading.value = true;
		try {
			const data = await got
				.post("api/chapters-read/", {
					json: payload,
				})
				.json<ChapterFormated>();
			chapter.value = data;
			return data;
		} finally {
			isPostChapterReadLoading.value = false;
		}
	}

	async function getChaptersRead() {
		isChaptersReadLoading.value = true;
		try {
			const data = await got
				.get("api/chapters-read/")
				.json<ChapterReadFormated[]>();
			chaptersRead.value = data;
			return data;
		} finally {
			isChaptersReadLoading.value = false;
		}
	}

	async function deleteChapterReading(payload: string) {
		isDeleteChapterReadLoading.value = true;
		try {
			const data = await got
				.delete(`api/chapters-read/${payload}`)
				.json<ChapterRead>();
			return data;
		} finally {
			isDeleteChapterReadLoading.value = false;
		}
	}

	function setMangas(value: Manga[]) {
		mangas.value = value;
	}

	function setManga(value: MangaWithChapters | null) {
		manga.value = value;
	}

	function setChapter(value: ChapterFormated | null) {
		chapter.value = value;
	}

	function setChaptersRead(value: ChapterReadFormated[]) {
		chaptersRead.value = value;
	}

	return {
		mangas,
		isMangasLoading,
		manga,
		isMangaLoading,
		chapter,
		isChapterLoading,
		chaptersRead,
		isChaptersReadLoading,
		isPostChapterReadLoading,
		isDeleteChapterReadLoading,
		getMangas,
		getManga,
		getChapter,
		postChapterReading,
		getChaptersRead,
		deleteChapterReading,
		setMangas,
		setManga,
		setChapter,
		setChaptersRead,
	};
});
