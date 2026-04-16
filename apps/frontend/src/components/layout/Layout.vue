<template>
  <component :is="componentLoader">
    <slot />
  </component>
</template>

<script setup lang="ts">
import {
	computed,
	defineAsyncComponent,
	defineComponent,
	ref,
	watch,
} from "vue";
import { useRoute } from "vue-router";

const componentName = ref("Blank");
const componentLoader = ref(
	computed(() => {
		const name = componentName.value;
		return defineAsyncComponent(() => import(`./${name}.vue`));
	}),
);
const route = useRoute();

watch(
	route,
	(to) => {
		if (to.meta.layout && to.meta.layout !== componentName.value) {
			componentName.value = to.meta.layout;
		}
	},
	{ immediate: true },
);
</script>
