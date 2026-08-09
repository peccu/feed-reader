<template>
  <button
    @click="onBack"
    aria-label="Back"
    class="absolute z-40 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl ring-1 ring-black/5 active:scale-95 transition-transform"
    :class="ui.sideClass"
    style="bottom: calc(env(safe-area-inset-bottom) + 4.75rem)"
  >
    <ArrowLeft :size="20" />
  </button>
</template>

<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useUiStore } from "../stores/ui.ts";

const props = defineProps<{ to?: string }>();
const router = useRouter();
const ui = useUiStore();

function onBack() {
  if (window.history.length > 1) router.back();
  else router.push(props.to ?? "/");
}
</script>
