import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

import Home from "@/views/Home.vue";

declare module "vue-router" {
	interface RouteMeta {
		// is optional
		layout?: string;
	}
}

const isNotLogged = async () => {
	const authStore = useAuthStore();
	if (!authStore.isLogged) {
		return true;
	}
	return { name: "home" };
};

const isLogged = async () => {
	const authStore = useAuthStore();
	if (!authStore.isLogged) {
		return true;
	}
	return { name: "login" };
};

const routes = [
	{
		path: "/login",
		name: "login",
		component: () =>
			import(/* webpackChunkName: "login" */ "../views/Login.vue"),
		beforeEnter: isNotLogged,
		meta: {
			layout: "NotLogged",
		},
	},
	{
		path: "/profile",
		name: "profile",
		component: () =>
			import(/* webpackChunkName: "profile" */ "../views/Profile.vue"),
		beforeEnter: isLogged,
		meta: {
			layout: "Logged",
		},
	},
	{
		path: "/chapters-read",
		name: "chaptersRead",
		component: () =>
			import(
				/* webpackChunkName: "chaptersRead" */ "../views/ChaptersRead.vue"
			),
		beforeEnter: isLogged,
		meta: {
			layout: "Logged",
		},
	},
	{
		path: "/manga/:mangaName",
		name: "manga",
		props: true,
		component: () =>
			import(/* webpackChunkName: "manga" */ "../views/Manga.vue"),
		beforeEnter: isLogged,
		meta: {
			layout: "Logged",
		},
	},
	{
		path: "/manga/:mangaName/chapter/:chapterNumber",
		name: "chapter",
		props: true,
		component: () =>
			import(/* webpackChunkName: "chapter" */ "../views/Chapter.vue"),
		beforeEnter: isLogged,
		meta: {
			layout: "Logged",
		},
	},
	{
		path: "/manga/:mangaName/chapter/:chapterNumber/page/:pageNumber",
		name: "page",
		props: true,
		component: () => import(/* webpackChunkName: "page" */ "../views/Page.vue"),
		beforeEnter: isLogged,
		meta: {
			layout: "Logged",
		},
	},
	{
		path: "/",
		name: "home",
		component: Home,
		beforeEnter: isLogged,
		meta: {
			layout: "Logged",
		},
	},
	{
		path: "/:pathMatch(.*)*",
		redirect: "/",
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;
