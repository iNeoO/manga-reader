<template>
  <div :class="isSidebarOpen ? 'block' : 'hidden'" @click="isSidebarOpen = false"
    class="fixed z-20 inset-0 bg-black opacity-50 transition-opacity lg:hidden">
  </div>

  <div ref="sidebar" :class="isSidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'"
    class="fixed z-30 inset-y-0 left-0 w-60 transition duration-300 transform bg-white
      dark:bg-gray-900 overflow-y-auto lg:translate-x-0 lg:static lg:inset-0">

  <div class="flex items-center justify-center mt-8">
    <div class="flex items-center">
      <span class="text-gray-800 dark:text-white text-2xl font-semibold">Manga reader</span>
    </div>
  </div>
  <nav class="flex flex-col mt-10 px-4 text-center">
    <!-- bg-gray-200 dark:bg-gray-800 -->
    <router-link :to="{ name: 'home' }"
      class="mt-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700
        dark:hover:text-gray-100  hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
      :class="isActive(['home', 'manga', 'chapter', 'page']) ? 'bg-gray-200 dark:bg-gray-800' : ''">
      Mangas
    </router-link>
    <router-link :to="{ name: 'chaptersRead' }"
      class="mt-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700
        dark:hover:text-gray-100  hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
      :class="isActive(['chaptersRead']) ? 'bg-gray-200 dark:bg-gray-800' : ''">
      Chapters read
    </router-link>
    <router-link :to="{ name: 'profile' }"
      class="mt-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700
        dark:hover:text-gray-100  hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
      :class="isActive(['profile']) ? 'bg-gray-200 dark:bg-gray-800' : ''">
      Profile
    </router-link>
  </nav>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';

import { useStore } from '@/store/index';
import { ApplicationMutationTypes } from '@/store/types/mutation.type';

export default defineComponent({
  name: 'loggedSidebar',
  setup() {
    const store = useStore();
    const route = useRoute();

    const isSidebarOpen = computed({
      get() {
        return store.getters['applicationStore/isSidebarOpen'];
      },
      set(value: boolean) {
        store.commit(ApplicationMutationTypes.SET_IS_SIDEBAR_OPEN, value);
      },
    });

    const isActive = (routeName: string[]):boolean => routeName.includes(route.name as string);

    return {
      isSidebarOpen,
      isActive,
    };
  },
});
</script>
