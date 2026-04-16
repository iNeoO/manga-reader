<template>
  <button @click="scrollToTop"
    v-show="isButtonVisible"
    class="fixed z-10 p-2 bg-gray-100 rounded-full shadow-md
      bottom-10 right-5 animate-bounce">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <!-- eslint-disable-next-line max-len -->
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18">
        </path>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
	windowSelector: string;
}>();

const isButtonVisible = ref(false);
let scrollElement: HTMLElement | null = null;

const getScrollElement = (): HTMLElement => {
	const element = document.querySelector<HTMLElement>(props.windowSelector);
	if (!element) {
		throw new Error(`Element ${props.windowSelector} not found !`);
	}
	return element;
};

const scrollHandler = () => {
	if (!scrollElement) {
		return;
	}
	isButtonVisible.value = scrollElement.scrollTop > 300;
};

onMounted(() => {
	scrollElement = getScrollElement();
	scrollElement.addEventListener("scroll", scrollHandler);
});

onBeforeUnmount(() => {
	scrollElement?.removeEventListener("scroll", scrollHandler);
});

const scrollToTop = () => {
	getScrollElement().scrollTo({
		top: 0,
		behavior: "smooth",
	});
};
</script>
