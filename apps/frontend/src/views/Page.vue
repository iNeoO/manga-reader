<template>
  <div class="w-full max-w-full mx-auto">
    <div class="flex justify-between mb-2">
      <div>
        <div
          v-if="!isLastChapter"
          class="text-gray-700 dark:text-gray-300
            underline
            cursor-pointer
            hover:text-indigo-500
            dark:hover:text-indigo-500"
          @click="goToNextChapter">
          <span>Go To next chapter</span>
        </div>
        <span class="text-gray-700 dark:text-gray-300">
          Nb Pages: {{ nbPages }}
        </span>
      </div>
      <button
        v-if="isLoading"
        class="inline-block text-gray-700 dark:text-gray-300
          hover:text-indigo-500
          dark:hover:text-indigo-500"
        :class="isLoading ? 'animate:spin' : ''"
        @click="reloadImage">
        <reload-icon />
      </button>
    </div>
    <div
      class="relative block w-full md:inline-block md:w-auto"
      :class="isDoublePage ? 'overflow-x-auto' : 'overflow-x-hidden md:overflow-visible'">
      <img
        v-if="pageId"
        id="page"
        v-loading-image="isLoading"
        :class="['image', { 'image-double': isDoublePage }]"
        :src="`/api/pages/${pageId}`">
      <button
        class="absolute inset-y-0 w-1/4 focus:outline-none"
        :disabled="!previousPage || isLoading"
        @click="goToPrevious" />
      <button
        class="absolute inset-y-0 w-1/4 right-0 focus:outline-none"
        :disabled="!nextPage || isLoading"
        @click="goToNext" />
    </div>
    <div class="flex justify-between mt-4">
      <div class="flex">
        <pagination
          :count="nbPages"
          :page="pageIndex + 1"
          :disabled="isLoading"
          @page-change="updatePagination" />
        <button
          v-if="isLoading"
          class="default-btn ml-4"
          @click="resetStates">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7.03 1.88c.252-1.01 1.688-1.01 1.94 0l2.905 11.62H14a.5.5 0 0 1 0 1H2a.5.5 0 0 1 0-1h2.125L7.03 1.88z"/>
          </svg>
        </button>
      </div>
      <go-to
        v-if="isInited"
        ref="goToRef"
        :count="nbPages"
        :page="pageIndex + 1"
        :disabled="isLoading"
        @page-change="updatePagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import GoTo from "@/components/utils/GoTo.vue";
import Pagination from "@/components/utils/Pagination.vue";
import ReloadIcon from "@/components/utils/ReloadIcon.vue";
import { useMangaStore } from "@/stores/mangaStore";
import { checkPage } from "@/utils/dataGetter";

const props = defineProps<{
	mangaName: string;
	chapterNumber: string;
	pageNumber: string;
}>();

const mangaStore = useMangaStore();
const router = useRouter();
const goToRef = ref<InstanceType<typeof GoTo> | null>(null);
const isInited = ref(false);
const isLoading = ref(false);
const isDoublePage = ref(false);

const manga = computed(() => mangaStore.manga);
const chapter = computed(() => mangaStore.chapter);

const pageIndex = computed(() => {
	const index = chapter.value?.pages?.findIndex(
		(page) => page.number === Number.parseInt(props.pageNumber, 10),
	);
	return index === undefined || index < 0 ? 0 : index;
});

const nbPages = computed(() => chapter.value?.pages?.length ?? 10);
const page = computed(() => chapter.value?.pages?.[pageIndex.value]);
const pageId = computed(() => page.value?.id);
const previousPage = computed(() =>
	pageIndex.value > 0 ? chapter.value?.pages?.[pageIndex.value - 1] ?? null : null,
);
const nextPage = computed(() =>
	pageIndex.value < (chapter.value?.pages?.length ?? 0) - 1
		? chapter.value?.pages?.[pageIndex.value + 1] ?? null
		: null,
);
const isLastChapter = computed(
	() => chapter.value?.number === manga.value?.chapters?.length,
);

const updateChapterReading = async (
	chapterId: string,
	isRead: boolean,
	lastPageReadId: string,
) => {
	isLoading.value = true;
	const main = document.querySelector("main");
	if (main) {
		main.scrollTo({
			left: 999,
			top: 0,
			behavior: "auto",
		});
	}

	await mangaStore.postChapterReading({
		chapterId,
		isRead,
		lastPageReadId,
	});
};

const goToPrevious = async () => {
	if (!previousPage.value?.id || !chapter.value) {
		return;
	}

	await router.push({
		name: "page",
		params: {
			mangaName: props.mangaName,
			chapterNumber: props.chapterNumber,
			pageNumber: previousPage.value.number,
		},
	});
	await updateChapterReading(chapter.value.id, false, previousPage.value.id);
	goToRef.value?.updatePage(previousPage.value.number);
};

const goToNext = async () => {
	if (!nextPage.value?.id || !chapter.value) {
		return;
	}

	await router.push({
		name: "page",
		params: {
			mangaName: props.mangaName,
			chapterNumber: props.chapterNumber,
			pageNumber: nextPage.value.number,
		},
	});

	await updateChapterReading(
		chapter.value.id,
		nextPage.value.number === chapter.value.pages.length,
		nextPage.value.id,
	);
	goToRef.value?.updatePage(nextPage.value.number);
};

const updatePage = async (pageIdToGo: string, index: number) => {
	await router.push({
		name: "page",
		params: {
			mangaName: props.mangaName,
			chapterNumber: props.chapterNumber,
			pageNumber: index,
		},
	});

	if (!chapter.value) {
		return;
	}

	await updateChapterReading(
		chapter.value.id,
		index === chapter.value.pages.length,
		pageIdToGo,
	);
	goToRef.value?.updatePage(index);
};

const updatePagination = async (index: number) => {
	const pageToGo = chapter.value?.pages[index - 1];
	if (!pageToGo) {
		return;
	}
	await updatePage(pageToGo.id, index);
};

const reloadImage = () => {
	const pageImg = document.getElementById("page");
	if (!pageImg) {
		return;
	}

	pageImg.setAttribute("src", `/api/pages/${pageId.value}?t=${Date.now()}`);
};

const keyEventHandler = (event: KeyboardEvent) => {
	if (event.key === "ArrowLeft") {
		void goToPrevious();
	} else if (event.key === "ArrowRight") {
		void goToNext();
	}
};

const goToNextChapter = async () => {
	await router.push({
		name: "page",
		params: {
			mangaName: props.mangaName,
			chapterNumber: Number.parseInt(props.chapterNumber, 10) + 1,
			pageNumber: 1,
		},
	});
	isInited.value = false;
	await checkPage(
		props.mangaName,
		Number.parseInt(props.chapterNumber, 10),
		Number.parseInt(props.pageNumber, 10),
	);
	isInited.value = true;
};

const resetStates = () => {
	isLoading.value = false;
};

const successHandler = () => {
	const pageElement = document.getElementById("page") as HTMLImageElement | null;
	if (pageElement) {
		isDoublePage.value =
			pageElement.naturalWidth > pageElement.naturalHeight * 1.15;
	}
	isLoading.value = false;
};

const errorHandler = () => {
	isDoublePage.value = false;
	isLoading.value = false;
};

watch(pageId, () => {
	isDoublePage.value = false;
});

onMounted(async () => {
	await checkPage(
		props.mangaName,
		Number.parseInt(props.chapterNumber, 10),
		Number.parseInt(props.pageNumber, 10),
	);
	isInited.value = true;

	document.addEventListener("keyup", keyEventHandler);
	const pageElement = document.getElementById("page");
	pageElement?.addEventListener("load", successHandler);
	pageElement?.addEventListener("error", errorHandler);
});

onBeforeUnmount(() => {
	document.removeEventListener("keyup", keyEventHandler);
	const pageElement = document.getElementById("page");
	pageElement?.removeEventListener("load", successHandler);
	pageElement?.removeEventListener("error", errorHandler);
});
</script>

<style scoped>
.image {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
}

.image-double {
  width: auto;
  height: 100dvh;
  max-width: none;
}

@media (min-width:768px) {
  .image {
    width: auto;
    height: 760px;
    max-width: 100%;
  }

  .image-double {
    max-width: 100%;
  }
}
@media (min-height:1280px) {
  .image {
    height: 1300px;
    max-width: 100%;
  }
}
</style>
