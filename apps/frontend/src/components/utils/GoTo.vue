<template>
  <div>
    <div class="inline-block mr-4 my-auto text-gray-700 dark:text-gray-300">Go to</div>
    <input
      type="text"
      class="default-input input-max-width inline-block my-auto py-1.5 px-2 text-center text-xs"
      v-model.number="input"
      maxlength="3"
      :disabled="disabled"
      @keyup.left.stop
      @keyup.right.stop
      @keyup.enter="updatePagination"
      @blur="updatePagination" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
	defineProps<{
		count: number;
		page: number;
		disabled?: boolean;
	}>(),
	{
		disabled: false,
	},
);

const emit = defineEmits<(event: "page-change", value: number) => void>();

const input = ref(props.page);

watch(
	() => props.page,
	(page) => {
		input.value = page;
	},
);

const updatePage = (page: number) => {
	input.value = page;
};

const updatePagination = () => {
	if (
		Number.isInteger(input.value) &&
		input.value >= 1 &&
		input.value <= props.count
	) {
		emit("page-change", input.value);
		return;
	}

	input.value = props.page;
};

defineExpose({
	updatePage,
});
</script>

<style scoped>
.input-max-width {
  max-width: 4rem;
}
</style>
