<template>
  <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
    Mangas
  </h2>
  <div ref="items">
    <item
      v-for="manga in mangaStore.mangas"
      :key="manga.id"
      :name="manga.name"
      :image-id="manga.coverPageId ?? ''"
      :to="{ name: 'manga', params: { mangaName: manga.name } }">
      <template #legend>
        <span class="text-sm text-gray-400">
          Number of chapters: {{ manga._count?.chapters }}
        </span>
      </template>
    </item>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import Item from "@/components/utils/Item.vue";
import { useLazyItemsObserver } from "@/composables/useLazyItemsObserver";
import { useMangaStore } from "@/stores/mangaStore";

const mangaStore = useMangaStore();
const { items, observeMutations } = useLazyItemsObserver();

onMounted(async () => {
	await mangaStore.getMangas();
	observeMutations();
});
</script>
