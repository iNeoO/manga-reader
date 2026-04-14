<template>
  <header class="flex justify-between items-center p-6 shadow">
    <div class="flex items-center space-x-4 lg:space-x-0">
      <button @click="isSidebarOpen = true"
        class="text-gray-500 dark:text-gray-300 focus:outline-none lg:hidden">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20M4 12H20M4 18H11" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="flex">
        <router-link
          :to="{ name: 'home' }"
          class="text-gray-700 dark:text-gray-300 mr-4
            hover:text-indigo-500
            dark:hover:text-indigo-500
            transform hover:scale-125">
          <svg x="0px" y="0px"
            width="26" height="26"
            viewBox="0 0 16 16"
            fill="currentColor">
            <!-- eslint-disable-next-line max-len -->
            <path d="M 8 1.320313 L 0.660156 8.132813 L 1.339844 8.867188 L 2 8.253906 L 2 14 L 7 14 L 7 9 L 9 9 L 9 14 L 14 14 L 14 8.253906 L 14.660156 8.867188 L 15.339844 8.132813 Z M 8 2.679688 L 13 7.328125 L 13 13 L 10 13 L 10 8 L 6 8 L 6 13 L 3 13 L 3 7.328125 Z"></path>
          </svg>
        </router-link>
      </div>
      <router-link v-if="mangaRedirection" :to ="mangaRedirection"
        class="hidden lg:block">
        <h2 class="text-3xl font-bold text-gray-700 dark:text-gray-300">
          <span class="hover:text-indigo-500">
            {{ mangaName }}
          </span>
        </h2>
      </router-link>
      <router-link v-if="chapterRedirection" :to="chapterRedirection"
        class="hidden lg:block">
        <span class="text-gray-700 dark:text-gray-300">/
          <span class="hover:text-indigo-500">
            {{ chapterName }}
          </span>
        </span>
      </router-link>
      <router-link
        v-if="mangaRedirection || chapterRedirection"
        :to="chapterRedirection || mangaRedirection"
        class="text-gray-700 dark:text-gray-300 mr-4
          hover:text-indigo-500
          dark:hover:text-indigo-500
          lg:hidden">
        <svg
          width="26" height="26"
          viewBox="0 0 16 16"
          fill="currentColor">
          <!-- eslint-disable-next-line max-len -->
          <path fill-rule="evenodd" d="M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5zM10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5z"/>
        </svg>
      </router-link>
    </div>
    <div class="flex items-center space-x-4">
      <div
        v-if="isOffline"
        class="text-gray-700 dark:text-gray-300 mr-4">
        <svg
          width="26" height="26"
          viewBox="0 0 16 16" fill="currentColor">
          <!-- eslint-disable-next-line max-len -->
          <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c.63 0 1.249.05 1.852.148l.854-.854zM8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065 8.448 8.448 0 0 1 3.51-1.27L8 6zm2.596 1.404.785-.785c.63.24 1.227.545 1.785.907a.482.482 0 0 1 .063.745.525.525 0 0 1-.652.065 8.462 8.462 0 0 0-1.98-.932zM8 10l.933-.933a6.455 6.455 0 0 1 2.013.637c.285.145.326.524.1.75l-.015.015a.532.532 0 0 1-.611.09A5.478 5.478 0 0 0 8 10zm4.905-4.905.747-.747c.59.3 1.153.645 1.685 1.03a.485.485 0 0 1 .047.737.518.518 0 0 1-.668.05 11.493 11.493 0 0 0-1.811-1.07zM9.02 11.78c.238.14.236.464.04.66l-.707.706a.5.5 0 0 1-.707 0l-.707-.707c-.195-.195-.197-.518.04-.66A1.99 1.99 0 0 1 8 11.5c.374 0 .723.102 1.021.28zm4.355-9.905a.53.53 0 0 1 .75.75l-10.75 10.75a.53.53 0 0 1-.75-.75l10.75-10.75z"/>
        </svg>
      </div>
      <button @click="isDarkMode = !isDarkMode"
        class="flex text-gray-600 dark:text-gray-300 hover:text-indigo-500
            dark:hover:text-indigo-500 transform focus:outline-none hover:scale-125">
        <svg v-if="isDarkMode" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <!-- eslint-disable-next-line max-len -->
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            fill-rule="evenodd"
            clip-rule="evenodd" />
        </svg>
        <svg v-else class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>
      <div class="relative">
        <button @click.stop="openDropdown"
          ref="usermenu"
          class="flex items-center space-x-2 relative hover:text-indigo-500
            text-gray-600 dark:text-gray-300
            dark:hover:text-indigo-500 transform focus:outline-none hover:scale-125"
          :class="isDropdownOpen ? 'text-indigo-500 dark:text-indigo-500 scale-125' : ''">
          {{ name }}
        </button>
        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md
          overflow-hidden shadow-xl z-10"
          v-show="isDropdownOpen">
          <router-link :to="{name: 'profile' }"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white">
            Profile
          </router-link>
          <a @click="logout"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white">
            Logout
          </a>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import Cookies from "js-cookie";
import {
	type ComputedRef,
	computed,
	defineComponent,
	onBeforeUnmount,
	ref,
} from "vue";

import { useRoute, useRouter } from "vue-router";

import { useStore } from "@/store/index";
import {
	ApplicationMutationTypes,
	AuthMutationTypes,
} from "@/store/types/mutation.type";

export default defineComponent({
	name: "loggedHeaderBar",
	setup() {
		const store = useStore();
		const router = useRouter();
		const route = useRoute();

		const isSidebarOpen = computed({
			get(): boolean {
				return store.getters["applicationStore/isSidebarOpen"];
			},
			set(value: boolean) {
				store.commit(ApplicationMutationTypes.SET_IS_SIDEBAR_OPEN, value);
			},
		});

		const isOffline = ref(false);

		const isDarkMode = computed({
			get(): boolean {
				return store.getters["applicationStore/isDarkMode"];
			},
			set(value: boolean) {
				store.commit(ApplicationMutationTypes.SET_IS_DARK_MODE, value);
			},
		});

		const name = computed(() => store.getters["userStore/user"]?.username);

		const mangaName = computed(() => store.getters["mangaStore/manga"]?.name);

		const chapterName = computed(
			() => store.getters["mangaStore/chapter"]?.name,
		);

		const usermenu = ref();

		const isDropdownOpen = ref(false);

		const openDropdown = () => {
			isDropdownOpen.value = true;
			const eventClick = (event: Event) => {
				if (!usermenu.value.contains(event.target)) {
					isDropdownOpen.value = false;
				}
				document.removeEventListener("click", eventClick);
			};
			document.addEventListener("click", eventClick);
		};

		const logout = () => {
			store.commit(AuthMutationTypes.SET_IS_LOGGED, false);
			Cookies.remove(process.env.VUE_APP_COOKIE_TOKEN_NAME);
			router.push({ name: "login" });
		};

		type Redirection = {
			name: string;
			params: {
				[key: string]: string;
			};
		};

		const mangaRedirection: ComputedRef<Redirection | null> = computed(() => {
			if (route.params.chapterNumber) {
				return {
					name: "manga",
					params: { mangaName: route.params.mangaName as string },
				};
			}
			return null;
		});

		const chapterRedirection: ComputedRef<Redirection | null> = computed(() => {
			if (route.params.pageNumber) {
				return {
					name: "chapter",
					params: {
						chapterNumber: route.params.chapterNumber as string,
						mangaName: route.params.mangaName as string,
					},
				};
			}
			return null;
		});

		const updateOnlineStatus = () => {
			isOffline.value = !navigator.onLine;
		};

		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);

		onBeforeUnmount(() => {
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOnlineStatus);
		});

		return {
			isOffline,
			isSidebarOpen,
			mangaRedirection,
			chapterRedirection,
			mangaName,
			chapterName,
			isDarkMode,
			name,
			usermenu,
			isDropdownOpen,
			openDropdown,
			logout,
		};
	},
});
</script>
