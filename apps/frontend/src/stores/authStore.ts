import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/lib/api";
import {
	clearAuthToken,
	setAuthToken,
	tokenCookieName,
} from "@/lib/auth";

export type LoginForm = {
	email: string;
	password: string;
};

export type LoginReturn = {
	access_token?: string;
	token?: string;
};

export const useAuthStore = defineStore("auth", () => {
	const isLogged = ref(false);
	const isLoginLoading = ref(false);

	async function login(payload: LoginForm) {
		isLoginLoading.value = true;

		try {
			const data = await api
				.post("auth/login/", {
					json: payload,
				})
				.json<LoginReturn>();

			const token = data.token ?? data.access_token;
			if (!token) {
				throw new Error("Missing authentication token.");
			}

			isLogged.value = true;
			setAuthToken(token);

			return { ...data, token, access_token: token };
		} finally {
			isLoginLoading.value = false;
		}
	}

	function setIsLogged(value: boolean) {
		isLogged.value = value;
	}

	function logout() {
		isLogged.value = false;
		clearAuthToken();
	}

	return {
		isLogged,
		isLoginLoading,
		login,
		logout,
		setIsLogged,
	};
});
