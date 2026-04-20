<template>
  <div v-if="manga && chapter">
    <div class="flex justify-between mb-4 hidden sm:block">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
        {{ manga.name }} <span class="text-base">/ {{ chapter.name }}</span>
      </h2>
      <p class="text-gray-400 font-mediun mt-auto">chapters: {{ manga.chapters.length }}</p>
    </div>
    <div ref="items">
      <item
        v-for="(page, index) in pages"
        :key="page.id"
        :id="`page-${index}`"
        :name="`Page: ${page.number}`"
        :image-id="page.id"
        :is-read="page.isRead"
        :to="{
          name: 'page',
          params: {
            mangaName: manga.name,
            chapterNumber: `${chapter.number}`,
            pageNumber: `${page.number}`,
          },
        }">
        <template #legend>
          <div class="text-sm text-gray-400">Page: {{ page.number }} / {{ pages.length }}</div>
        </template>
      </item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import Item from "@/components/utils/Item.vue";
import { useLazyItemsObserver } from "@/composables/useLazyItemsObserver";
import { useMangaStore } from "@/stores/mangaStore";
import { checkChapter } from "@/utils/dataGetter";

const props = defineProps<{
	mangaName: string;
	chapterNumber: string;
}>();

const mangaStore = useMangaStore();
const manga = computed(() => mangaStore.manga);
const chapter = computed(() => mangaStore.chapter);
const pages = computed(() => chapter.value?.pages ?? []);
const { items, observeMutations } = useLazyItemsObserver();

onMounted(async () => {
	await checkChapter(props.mangaName, Number.parseInt(props.chapterNumber, 10));

	const main = document.querySelector("main");
	if (main) {
		main.scrollTo({
			top: 0,
			behavior: "auto",
		});
	}

	observeMutations();
});
</script>
