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

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  onBeforeUnmount,
} from 'vue';

export default defineComponent({
  name: 'topButton',
  props: {
    windowSelector: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const isButtonVisible:Ref<boolean> = ref(false);

    onMounted(() => {
      const element = document.querySelector(props.windowSelector);
      if (!element) {
        throw new Error(`Element ${props.windowSelector} not found !`);
      }
      const scrollHandler = () => {
        isButtonVisible.value = element.scrollTop > 300;
      };
      element.addEventListener('scroll', scrollHandler);

      onBeforeUnmount(() => {
        element.removeEventListener('scroll', scrollHandler);
      });
    });

    const scrollToTop = () => {
      const element = document.querySelector(props.windowSelector);
      if (!element) {
        throw new Error(`Element ${props.windowSelector} not found !`);
      }
      element.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

    return {
      scrollToTop,
      isButtonVisible,
    };
  },
});
</script>
