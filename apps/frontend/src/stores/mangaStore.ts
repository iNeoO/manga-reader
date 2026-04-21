import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/lib/api";

import type { ChapterFormated } from "@/types/chapter";
import type {
	ChapterRead,
	ChapterReadFormated,
	PostChapterReadPayload,
} from "@/types/chapterRead";
import type { Manga, MangaWithChapters } from "@/types/manga";

type MangaImportResult = {
	mangaId: string;
	chapterCount: number;
	pageCount: number;
};

type DeleteMangaResult = {
	id: string;
	name: string;
	chapterCount: number;
	pageCount: number;
};

const encodePathSegment = (value: string) => encodeURIComponent(value);

export const useMangaStore = defineStore("manga", () => {
	const mangas = ref<Manga[]>([]);
	const isMangasLoading = ref(false);
	const isMangaImportLoading = ref(false);
	const manga = ref<MangaWithChapters | null>(null);
	const isMangaLoading = ref(false);
	const isDeleteMangaLoading = ref(false);
	const chapter = ref<ChapterFormated | null>(null);
	const isChapterLoading = ref(false);
	const chaptersRead = ref<ChapterReadFormated[]>([]);
	const isChaptersReadLoading = ref(false);
	const isPostChapterReadLoading = ref(false);
	const isDeleteChapterReadLoading = ref(false);

	async function getMangas() {
		isMangasLoading.value = true;
		try {
			const data = await api.get("api/mangas/").json<Manga[]>();
			mangas.value = data;
			return data;
		} finally {
			isMangasLoading.value = false;
		}
	}

	async function importMangaZip(file: File) {
		isMangaImportLoading.value = true;

		try {
			const formData = new FormData();
			formData.append("file", file);

			const data = await api
				.post("api/mangas/import", {
					body: formData,
				})
				.json<MangaImportResult>();

			return data;
		} finally {
			isMangaImportLoading.value = false;
		}
	}

	async function getManga(payload: string) {
		isMangaLoading.value = true;
		try {
			const data = await api
				.get(`api/mangas/${encodePathSegment(payload)}`)
				.json<MangaWithChapters>();
			manga.value = data;
			return data;
		} finally {
			isMangaLoading.value = false;
		}
	}

	async function removeManga(payload: string) {
		isDeleteMangaLoading.value = true;
		try {
			const data = await api
				.delete(`api/mangas/${encodePathSegment(payload)}`)
				.json<DeleteMangaResult>();

			mangas.value = mangas.value.filter((entry) => entry.name !== payload);
			if (manga.value?.name === payload) {
				manga.value = null;
			}
			if (chapter.value?.mangaId === data.id) {
				chapter.value = null;
			}
			chaptersRead.value = chaptersRead.value.filter(
				(entry) => entry.manga.id !== data.id,
			);

			return data;
		} finally {
			isDeleteMangaLoading.value = false;
		}
	}

	async function getChapter(payload: string) {
		isChapterLoading.value = true;
		try {
			const data = await api
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
			const data = await api
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
			const data = await api
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
			const data = await api
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
		isMangaImportLoading,
		manga,
		isMangaLoading,
		isDeleteMangaLoading,
		chapter,
		isChapterLoading,
		chaptersRead,
		isChaptersReadLoading,
		isPostChapterReadLoading,
		isDeleteChapterReadLoading,
		getMangas,
		importMangaZip,
		getManga,
		removeManga,
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
