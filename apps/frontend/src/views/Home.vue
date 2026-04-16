<template>
  <div class="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
    <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
      Mangas
    </h2>
    <div class="flex flex-col items-start gap-3 md:items-end">
      <input
        ref="fileInputRef"
        type="file"
        accept=".zip,application/zip"
        class="hidden"
        @change="onFileChange">
      <button
        class="default-btn"
        :disabled="mangaStore.isMangaImportLoading"
        @click="openFileDialog">
        {{ mangaStore.isMangaImportLoading ? "Uploading..." : "Upload manga ZIP" }}
      </button>
      <alert
        v-if="uploadMessage"
        :type="uploadStatus"
        :title="uploadStatus === 'success' ? 'Success' : 'Error'"
        :subtitle="uploadMessage" />
    </div>
  </div>
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
import { onMounted, ref } from "vue";

import Alert from "@/components/utils/Alert.vue";
import Item from "@/components/utils/Item.vue";
import { useLazyItemsObserver } from "@/composables/useLazyItemsObserver";
import { useMangaStore } from "@/stores/mangaStore";

const mangaStore = useMangaStore();
const { items, observeMutations } = useLazyItemsObserver();
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadMessage = ref("");
const uploadStatus = ref<"success" | "error">("success");

const openFileDialog = () => {
	fileInputRef.value?.click();
};

const resetFileInput = () => {
	if (fileInputRef.value) {
		fileInputRef.value.value = "";
	}
};

const onFileChange = async (event: Event) => {
	const input = event.target as HTMLInputElement | null;
	const file = input?.files?.[0];

	if (!file) {
		return;
	}

	uploadMessage.value = "";

	try {
		const result = await mangaStore.importMangaZip(file);
		await mangaStore.getMangas();
		uploadStatus.value = "success";
		uploadMessage.value = `Manga imported: ${result.chapterCount} chapters, ${result.pageCount} pages.`;
	} catch (error) {
		uploadStatus.value = "error";
		uploadMessage.value =
			error instanceof Error ? error.message : "Manga import failed.";
	} finally {
		resetFileInput();
	}
};

onMounted(async () => {
	await mangaStore.getMangas();
	observeMutations();
});
</script>
