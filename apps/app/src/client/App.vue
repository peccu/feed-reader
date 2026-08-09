<template>
  <div class="h-full flex flex-col" :class="{ dark: isDark }">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const isDark = ref(false);

onMounted(() => {
  isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    isDark.value = e.matches;
  });
});
</script>
