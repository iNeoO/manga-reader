import got from "got";
import Cookies from "js-cookie";
import { defineStore } from "pinia";
import { ref } from "vue";

export type LoginForm = {
	email: string;
	password: string;
};

export type LoginReturn = {
	access_token: string;
};

export const tokenCookieName =
	import.meta.env.VITE_COOKIE_TOKEN_NAME ??
	import.meta.env.VUE_APP_COOKIE_TOKEN_NAME ??
	"access_token";
const tokenCookieDuration = Number(
	import.meta.env.VITE_COOKIE_TOKEN_DURATION ??
		import.meta.env.VUE_APP_COOKIE_TOKEN_DURATION ??
		1,
);

export const useAuthStore = defineStore("auth", () => {
	const isLogged = ref(false);
	const isLoginLoading = ref(false);

	async function login(payload: LoginForm) {
		isLoginLoading.value = true;

		try {
			const data = await got
				.post("auth/login/", {
					json: payload,
				})
				.json<LoginReturn>();

			isLogged.value = true;
			Cookies.set(tokenCookieName, data.access_token, {
				expires: tokenCookieDuration,
				secure: true,
			});

			return data;
		} finally {
			isLoginLoading.value = false;
		}
	}

	function setIsLogged(value: boolean) {
		isLogged.value = value;
	}

	function logout() {
		isLogged.value = false;
		Cookies.remove(tokenCookieName);
	}

	return {
		isLogged,
		isLoginLoading,
		login,
		logout,
		setIsLogged,
	};
});
