import Cookies from "js-cookie";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { pinia } from "./stores";
import { tokenCookieName, useAuthStore } from "./stores/authStore";
import { useUserStore } from "./stores/userStore";

const bootstrapAuth = async () => {
	const authStore = useAuthStore(pinia);
	const userStore = useUserStore(pinia);

	if (!Cookies.get(tokenCookieName)) {
		authStore.setIsLogged(false);
		return;
	}

	try {
		await userStore.getUser();
		authStore.setIsLogged(true);
	} catch (_error) {
		authStore.logout();
	}
};

const mountApp = async () => {
	await bootstrapAuth();

	const app = createApp(App);
	app.use(pinia);
	app.use(router);
	app.mount("#app");
};

void mountApp();
