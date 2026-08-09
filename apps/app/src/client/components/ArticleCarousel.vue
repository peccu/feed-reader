<template>
  <div class="relative h-full overflow-hidden select-none">
    <!-- Scroll container -->
    <div
      ref="scrollEl"
      class="flex h-full overflow-x-scroll snap-x snap-mandatory scroll-smooth"
      style="scrollbar-width: none; -ms-overflow-style: none"
      @scroll.passive="onScroll"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
    >
      <slot />
    </div>

    <!-- Left tap area -->
    <div
      class="absolute left-0 top-0 h-full w-16 z-10 cursor-pointer"
      :class="{ 'opacity-0': !canGoBack }"
      @click="emit('navigate', -1)"
    >
      <div
        class="absolute left-2 top-1/2 -translate-y-1/2 text-foreground/30 text-2xl"
        v-if="canGoBack"
      >
        ‹
      </div>
    </div>

    <!-- Right tap area -->
    <div
      class="absolute right-0 top-0 h-full w-16 z-10 cursor-pointer"
      :class="{ 'opacity-0': !canGoForward }"
      @click="emit('navigate', 1)"
    >
      <div
        class="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/30 text-2xl"
        v-if="canGoForward"
      >
        ›
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps<{
  currentIndex: number;
  total: number;
}>();

const emit = defineEmits<{
  navigate: [delta: number];
  indexChange: [index: number];
}>();

const scrollEl = ref<HTMLElement | null>(null);

const canGoBack = computed(() => props.currentIndex > 0);
const canGoForward = computed(() => props.currentIndex < props.total - 1);

// Sync scroll position when currentIndex changes externally
watch(
  () => props.currentIndex,
  (idx) => {
    nextTick(() => {
      const el = scrollEl.value;
      if (!el) return;
      el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    });
  },
);

// Update store index when user scrolls manually
function onScroll() {
  const el = scrollEl.value;
  if (!el) return;
  const idx = Math.round(el.scrollLeft / el.clientWidth);
  if (idx !== props.currentIndex) {
    emit("indexChange", idx);
  }
}

// Touch / mouse swipe detection
let touchStartX = 0;
const SWIPE_THRESHOLD = 50;

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0]?.clientX ?? 0;
}

function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
  if (Math.abs(dx) > SWIPE_THRESHOLD) {
    emit("navigate", dx < 0 ? 1 : -1);
  }
}

let mouseStartX = 0;
function onMouseDown(e: MouseEvent) {
  mouseStartX = e.clientX;
}
function onMouseUp(e: MouseEvent) {
  const dx = e.clientX - mouseStartX;
  if (Math.abs(dx) > SWIPE_THRESHOLD) {
    emit("navigate", dx < 0 ? 1 : -1);
  }
}
</script>

<style scoped>
div::-webkit-scrollbar {
  display: none;
}
</style>
