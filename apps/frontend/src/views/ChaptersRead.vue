<template>
  <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
    Chapters read
  </h2>
  <table class="min-w-max w-full table-auto bg-white dark:bg-gray-900">
    <thead>
      <tr class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal
        dark:bg-gray-700 dark:text-gray-400">
        <th
          v-for="header in headers"
          :key="header"
          class="py-3 px-6 text-left">{{ header }}
        </th>
      </tr>
    </thead>
    <tbody class="text-gray-600 dark:text-gray-400 text-sm font-light">
      <tr
        v-for="(chapterRead, index) in mangaStore.chaptersRead"
        :key="index"
        class="border-b border-gray-200 dark:border-gray-700">
        <td class="py-3 px-6 text-left whitespace-nowrap">
          <router-link
            :to="{ name: 'manga', params: { mangaName: chapterRead.manga.name } }"
            class="font-medium underline text-gray-700 dark:text-gray-400 text-lg
            hover:text-indigo-500 dark:hover:text-indigo-500">
            {{ chapterRead.manga.name }}
          </router-link>
        </td>
        <td class="py-3 px-6 text-left whitespace-nowrap">
          <router-link
            :to="{ name: 'chapter', params: {
              mangaName: chapterRead.manga.name,
              chapterNumber: chapterRead.chapter.number
            } }"
            class="font-medium underline text-gray-700 dark:text-gray-400 text-lg
            hover:text-indigo-500 dark:hover:text-indigo-500">
            {{ chapterRead.chapter.name }} (nb: {{ chapterRead.chapter.number }})
          </router-link>
        </td>
        <td class="py-3 px-6 text-left whitespace-nowrap">
          <span class="bg-purple-200 text-purple-600 py-1 px-3 rounded-full text-xs">
            {{ chapterRead.page.number }} / {{ chapterRead.chapter.nbPages }}
          </span>
        </td>
        <td class="py-3 px-6 text-left whitespace-nowrap">
          <svg
            v-if="chapterRead.isRead"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-green-500">
            <path d="M 12 2 C 6.486 2 2 6.486 2 12 C 2 17.514 6.486 22 12 22 C 17.514 22 22 17.514 22 12 C 22 10.874 21.803984 9.7942031 21.458984 8.7832031 L 19.839844 10.402344 C 19.944844 10.918344 20 11.453 20 12 C 20 16.411 16.411 20 12 20 C 7.589 20 4 16.411 4 12 C 4 7.589 7.589 4 12 4 C 13.633 4 15.151922 4.4938906 16.419922 5.3378906 L 17.851562 3.90625 C 16.203562 2.71225 14.185 2 12 2 z M 21.292969 3.2929688 L 11 13.585938 L 7.7070312 10.292969 L 6.2929688 11.707031 L 11 16.414062 L 22.707031 4.7070312 L 21.292969 3.2929688 z"></path>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-red-500">
            <path d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 8.7070312 7.2929688 L 7.2929688 8.7070312 L 10.585938 12 L 7.2929688 15.292969 L 8.7070312 16.707031 L 12 13.414062 L 15.292969 16.707031 L 16.707031 15.292969 L 13.414062 12 L 16.707031 8.7070312 L 15.292969 7.2929688 L 12 10.585938 L 8.7070312 7.2929688 z"></path>
          </svg>
        </td>
        <td class="py-3 px-6 text-left whitespace-nowrap">
          {{ formatDate(chapterRead.updatedAt) }}
        </td>
        <td class="py-3 px-6 text-left whitespace-nowrap">
          {{ formatDate(chapterRead.createdAt) }}
        </td>
        <td class="py-3 px-6 text-left whitespace-nowrap">
          <button class="w-4 focus:outline-none hover:text-indigo-500
            dark:hover:text-indigo-500 transform hover:scale-150"
            @click="deleteChapterRead(chapterRead.chapter.id)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { useMangaStore } from "@/stores/mangaStore";

const mangaStore = useMangaStore();

const headers = [
	"Manga",
	"ChapterName",
	"PageNumber",
	"Is read",
	"Created at",
	"Updated at",
	"edit",
];

onMounted(async () => {
	await mangaStore.getChaptersRead();
});

const formatDate = (date: Date | string) => {
	const d = new Date(date);
	const month = `0${d.getMonth() + 1}`.slice(-2);
	const day = `0${d.getDate()}`.slice(-2);
	const year = d.getFullYear();
	const hours = `0${d.getHours()}`.slice(-2);
	const minutes = `0${d.getMinutes()}`.slice(-2);

	return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const deleteChapterRead = async (chapterId: string) => {
	await mangaStore.deleteChapterReading(chapterId);
	await mangaStore.getChaptersRead();
};
</script>
