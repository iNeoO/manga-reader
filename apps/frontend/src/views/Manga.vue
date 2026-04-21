<template>
  <div v-if="manga">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {{ manga.name }}
        </h2>
        <p class="mt-2 text-gray-400">chapters: {{ manga.chapters.length }}</p>
      </div>
      <button
        class="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="mangaStore.isDeleteMangaLoading"
        @click="deleteCurrentManga">
        {{ mangaStore.isDeleteMangaLoading ? "Deleting..." : "Delete manga" }}
      </button>
    </div>
    <div ref="items">
      <item
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        :id="`chapter-${index + 1}`"
        :name="chapter.name"
        :image-id="chapter.coverPageId ?? ''"
        :is-read="chapter.isRead"
        :to="{
          name: 'chapter',
          params: { mangaName: manga.name, chapterNumber: `${chapter.number}` } }">
        <template #legend>
          <span class="text-sm text-gray-400">
            Number of pages read: {{ chapter.countPagesRead }} / {{ chapter.count }}
          </span>
        </template>
      </item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

import Item from "@/components/utils/Item.vue";
import { useLazyItemsObserver } from "@/composables/useLazyItemsObserver";
import { checkManga } from "@/utils/dataGetter";
import { useMangaStore } from "@/stores/mangaStore";

const props = defineProps<{
	mangaName: string;
}>();

const mangaStore = useMangaStore();
const router = useRouter();
const manga = computed(() => mangaStore.manga);
const chapters = computed(() => manga.value?.chapters ?? []);
const { items, observeMutations } = useLazyItemsObserver();

const deleteCurrentManga = async () => {
	if (!manga.value) {
		return;
	}

	const shouldDelete = window.confirm(
		`Delete "${manga.value.name}" and all its chapters, pages, and reading progress?`,
	);
	if (!shouldDelete) {
		return;
	}

	await mangaStore.removeManga(manga.value.name);
	await router.push({ name: "home" });
};

onMounted(async () => {
	await checkManga(props.mangaName);

	if (chapters.value.length > 0) {
		const indexFound = chapters.value.findIndex((chapter) => chapter.isRead);
		const index = indexFound === -1 ? chapters.value.length : indexFound === 0 ? indexFound : indexFound - 1;
		const chapterElement = document.querySelector(`#chapter-${index}`);
		const main = document.querySelector("main");

		if (main && chapterElement) {
			const { top } = chapterElement.getBoundingClientRect();
			main.scrollTo({
				top,
				behavior: "auto",
			});
		}
	}

	observeMutations();
});
</script>
