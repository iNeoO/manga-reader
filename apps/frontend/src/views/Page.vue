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
          Page: {{ currentPageNumber }} / {{ nbPages }}
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
    <!-- Two constraints hold this wrapper together, both about keeping the nav
         zones reachable on a wide double page:
         - it must stay OUTSIDE the scroll container, because an absolutely
           positioned box whose containing block is a scroll container belongs to
           its scrollable overflow and would scroll away with the image;
         - it needs a definite width, because shrink-to-fit would size it to the
           image's max-content width (a replaced element has no zero min-content)
           and push the overflow up to `main`. Single pages keep shrink-wrapping
           the image so the zones stay aligned with its edges. -->
    <div
      class="relative block w-full"
      :class="isDoublePage ? '' : 'md:inline-block md:w-auto'">
      <div
        ref="scrollerRef"
        class="page-scroller"
        :class="isDoublePage ? 'overflow-x-auto' : 'overflow-x-hidden md:overflow-visible'">
        <img
          v-if="pageSrc"
          ref="imageRef"
          :class="['image', { 'image-double': isDoublePage }]"
          :src="pageSrc"
          draggable="false"
          @load="successHandler"
          @error="errorHandler">
      </div>
      <button
        class="absolute inset-y-0 left-0 w-1/4 z-10 touch-pan-y select-none focus:outline-none"
        :class="isDoublePage ? 'cursor-grab' : ''"
        aria-label="Previous page"
        :disabled="!previousPage || isLoading"
        @pointerdown="startPan"
        @pointermove="pan"
        @pointerup="endPan($event, goToPrevious)"
        @pointercancel="cancelPan"
        @keyup.enter="goToPrevious"
        @keyup.space="goToPrevious" />
      <button
        class="absolute inset-y-0 right-0 w-1/4 z-10 touch-pan-y select-none focus:outline-none"
        :class="isDoublePage ? 'cursor-grab' : ''"
        aria-label="Next page"
        :disabled="!nextPage || isLoading"
        @pointerdown="startPan"
        @pointermove="pan"
        @pointerup="endPan($event, goToNext)"
        @pointercancel="cancelPan"
        @keyup.enter="goToNext"
        @keyup.space="goToNext" />
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
import { getAuthToken } from "@/lib/auth";
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
const scrollerRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const isInited = ref(false);
const isLoading = ref(false);
const isDoublePage = ref(false);
const pageSrc = ref<string | null>(null);

// Beyond this many pixels a pointer gesture is a pan, not a tap on a nav zone.
const tapMoveThreshold = 10;

const panState = {
	pointerId: null as number | null,
	startX: 0,
	startY: 0,
	startScrollLeft: 0,
	isDrag: false,
};

const manga = computed(() => mangaStore.manga);
const chapter = computed(() => mangaStore.chapter);

const pageIndex = computed(() => {
	const index = chapter.value?.pages?.findIndex(
		(page) => page.number === Number.parseInt(props.pageNumber, 10),
	);
	return index === undefined || index < 0 ? 0 : index;
});

const nbPages = computed(() => chapter.value?.pages?.length ?? 10);
const currentPageNumber = computed(() => page.value?.number ?? 0);
const page = computed(() => chapter.value?.pages?.[pageIndex.value]);
const pageId = computed(() => page.value?.id);
const previousPage = computed(() =>
	pageIndex.value > 0
		? (chapter.value?.pages?.[pageIndex.value - 1] ?? null)
		: null,
);
const nextPage = computed(() =>
	pageIndex.value < (chapter.value?.pages?.length ?? 0) - 1
		? (chapter.value?.pages?.[pageIndex.value + 1] ?? null)
		: null,
);
const isLastChapter = computed(
	() => chapter.value?.number === manga.value?.chapters?.length,
);

// The nav zones cover half the visible width, so a gesture starting on one of
// them has to be able to pan a wide double page instead of being swallowed as a
// tap. The browser can't do it for us: the scroll container is a sibling of the
// zones, not an ancestor, so it never receives the native gesture.
const startPan = (event: PointerEvent) => {
	if (event.button !== 0) {
		return;
	}

	panState.pointerId = event.pointerId;
	panState.startX = event.clientX;
	panState.startY = event.clientY;
	panState.startScrollLeft = scrollerRef.value?.scrollLeft ?? 0;
	panState.isDrag = false;

	(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
};

const pan = (event: PointerEvent) => {
	if (panState.pointerId !== event.pointerId) {
		return;
	}

	const deltaX = event.clientX - panState.startX;
	const deltaY = event.clientY - panState.startY;

	if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > tapMoveThreshold) {
		panState.isDrag = true;
	}

	if (panState.isDrag && isDoublePage.value && scrollerRef.value) {
		scrollerRef.value.scrollLeft = panState.startScrollLeft - deltaX;
	}
};

const endPan = (event: PointerEvent, navigate: () => Promise<void>) => {
	if (panState.pointerId !== event.pointerId) {
		return;
	}

	panState.pointerId = null;

	if (panState.isDrag) {
		return;
	}

	void navigate();
};

const cancelPan = (event: PointerEvent) => {
	if (panState.pointerId !== event.pointerId) {
		return;
	}

	panState.pointerId = null;
	panState.isDrag = false;
};

// Every page must start at the same reading position: the scrollable element in
// double-page mode is the inner container, not `main`.
const resetScrollPosition = () => {
	document.querySelector("main")?.scrollTo({
		top: 0,
		behavior: "auto",
	});

	if (scrollerRef.value) {
		scrollerRef.value.scrollLeft = 0;
	}
};

const updateChapterReading = async (
	chapterId: string,
	isRead: boolean,
	lastPageReadId: string,
) => {
	isLoading.value = true;
	resetScrollPosition();

	await mangaStore.postChapterReading({
		chapterId,
		isRead,
		lastPageReadId,
	});
};

const goToPrevious = async () => {
	// Snapshot the target: `previousPage` is derived from the route, so it is
	// recomputed by the push below and is null once we land on the first page.
	const target = previousPage.value;
	if (!target?.id || !chapter.value) {
		return;
	}

	await router.push({
		name: "page",
		params: {
			mangaName: props.mangaName,
			chapterNumber: props.chapterNumber,
			pageNumber: target.number,
		},
	});
	await updateChapterReading(chapter.value.id, false, target.id);
	goToRef.value?.updatePage(target.number);
};

const goToNext = async () => {
	// Same as goToPrevious: `nextPage` is null again as soon as the push lands on
	// the last page, which used to throw before the chapter was marked as read.
	const target = nextPage.value;
	if (!target?.id || !chapter.value) {
		return;
	}

	await router.push({
		name: "page",
		params: {
			mangaName: props.mangaName,
			chapterNumber: props.chapterNumber,
			pageNumber: target.number,
		},
	});

	await updateChapterReading(
		chapter.value.id,
		target.number === chapter.value.pages.length,
		target.id,
	);
	goToRef.value?.updatePage(target.number);
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

const revokePageSrc = () => {
	if (!pageSrc.value) {
		return;
	}

	URL.revokeObjectURL(pageSrc.value);
	pageSrc.value = null;
};

const loadPageImage = async (force = false) => {
	if (!pageId.value) {
		revokePageSrc();
		return;
	}

	isLoading.value = true;
	// isDoublePage is deliberately left as-is: resetting it here and recomputing
	// it in successHandler flashes the layout between two pages of the same kind.

	const token = getAuthToken();
	const headers = new Headers();
	if (token) {
		headers.set("authorization", token);
	}

	const suffix = force ? `?t=${Date.now()}` : "";

	try {
		const response = await fetch(`/api/pages/${pageId.value}${suffix}`, {
			headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status} ${response.statusText}`);
		}

		const blob = await response.blob();
		revokePageSrc();
		pageSrc.value = URL.createObjectURL(blob);
	} catch (_error) {
		revokePageSrc();
		isLoading.value = false;
	}
};

const reloadImage = () => {
	if (!pageId.value) {
		return;
	}

	void loadPageImage(true);
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
	const pageElement = imageRef.value;
	if (pageElement) {
		isDoublePage.value =
			pageElement.naturalWidth > pageElement.naturalHeight * 1.15;
	}
	resetScrollPosition();
	isLoading.value = false;
};

const errorHandler = () => {
	isDoublePage.value = false;
	isLoading.value = false;
};

watch(pageId, () => {
	void loadPageImage();
});

onMounted(async () => {
	await checkPage(
		props.mangaName,
		Number.parseInt(props.chapterNumber, 10),
		Number.parseInt(props.pageNumber, 10),
	);
	isInited.value = true;

	document.addEventListener("keyup", keyEventHandler);
	void loadPageImage();
});

onBeforeUnmount(() => {
	document.removeEventListener("keyup", keyEventHandler);
	revokePageSrc();
});
</script>

<style scoped>
.page-scroller {
  /* Don't hand the gesture over to `main` once this container hits its end. */
  overscroll-behavior-x: contain;
}

.image {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
}

/* Double pages are sized by their height and overflow horizontally, the scroll
   container absorbing the extra width. `max-width` must stay `none` here: for a
   replaced element with a specified height, max-width clamps the width without
   recomputing the height (CSS 2.1 §10.4), which squashes the spread.
   `.image.image-double` is intentional — it makes these rules independent of
   the source order of the `.image` rules below. */
.image.image-double {
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

  .image.image-double {
    height: 760px;
  }
}
@media (min-height:1280px) {
  .image {
    height: 1300px;
    max-width: 100%;
  }

  .image.image-double {
    height: 1300px;
  }
}
</style>
