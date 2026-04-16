import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/lib/api";

export type User = {
	id: string;
	email: string;
	username: string;
	createdAt: Date;
	lastLoginOn: Date;
};

export const useUserStore = defineStore("user", () => {
	const user = ref<User | null>(null);
	const isUserLoading = ref(false);

	async function getUser() {
		isUserLoading.value = true;
		try {
			const data = await api.get("api/user").json<User>();
			user.value = data;
			return data;
		} finally {
			isUserLoading.value = false;
		}
	}

	return { getUser, user, isUserLoading };
});
