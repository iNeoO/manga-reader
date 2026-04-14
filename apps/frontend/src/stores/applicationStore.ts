import { defineStore } from "pinia";
import { ref } from "vue";

const env = import.meta.env as Record<string, string | undefined>;
const darkThemeStorageKey =
	env.VITE_STORAGE_DARK_THEME_KEY ??
	env.VUE_APP_STORAGE_DARK_THEME_KEY ??
	"dark-theme";

const getInitialDarkMode = () => {
	if (typeof window === "undefined") {
		return false;
	}

	return Boolean(window.localStorage.getItem(darkThemeStorageKey));
};

const syncDarkModeClass = (value: boolean) => {
	if (typeof document === "undefined") {
		return;
	}

	document.body.classList.toggle("dark", value);
};

export const useApplicationStore = defineStore("application", () => {
	const isDarkMode = ref(getInitialDarkMode());
	const isSidebarOpen = ref(false);

	syncDarkModeClass(isDarkMode.value);

	function setIsDarkMode(value: boolean) {
		if (typeof window !== "undefined") {
			if (value) {
				window.localStorage.setItem(darkThemeStorageKey, "true");
			} else {
				window.localStorage.removeItem(darkThemeStorageKey);
			}
		}

		syncDarkModeClass(value);
		isDarkMode.value = value;
	}

	function setIsSidebarOpen(value: boolean) {
		isSidebarOpen.value = value;
	}

	return {
		isDarkMode,
		isSidebarOpen,
		setIsDarkMode,
		setIsSidebarOpen,
	};
});
