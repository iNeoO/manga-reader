<template>
  <component :is="componentLoader">
    <slot />
  </component>
</template>

<script lang="ts">
import {
  defineComponent, ref, defineAsyncComponent, computed,
} from 'vue';
import { RouteLocationNormalized } from 'vue-router';

export default defineComponent({
  name: 'layout',
  setup() {
    const componentName = ref('Blank');
    const componentLoader = ref(
      computed(() => {
        const name = componentName.value;
        return defineAsyncComponent(
          () => import(`./${name}.vue`),
        );
      }),
    );
    return {
      componentName,
      componentLoader,
    };
  },
  watch: {
    $route: {
      handler(to: RouteLocationNormalized): void {
        if (to.meta.layout && to.meta.layout !== this.componentName) {
          this.componentName = to.meta.layout;
        }
      },
      immediate: true,
    },
  },
});
</script>
