<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-800 font-roboto">
    <sidebar />

    <div class="flex-1 flex flex-col overflow-hidden">

      <header-bar @open-sidebar="isSidebarOpen = true" />

      <main class="flex-1 overflow-x-auto overflow-y-auto pb-24">
        <div class="container mx-auto md:px-6 xs:py-4 md:py-6">
          <slot />
        </div>
      </main>

      <top-button window-selector="main" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HeaderBar from "@/components/layout/logged/HeaderBar.vue";
import Sidebar from "@/components/layout/logged/Sidebar.vue";
import TopButton from "@/components/layout/logged/TopButton.vue";
import { useApplicationStore } from "@/stores/applicationStore";

const applicationStore = useApplicationStore();

const isSidebarOpen = computed({
	get(): boolean {
		return applicationStore.isSidebarOpen;
	},
	set(value: boolean) {
		applicationStore.setIsSidebarOpen(value);
	},
});
</script>
