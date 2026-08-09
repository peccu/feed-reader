<template>
  <div class="relative h-full overflow-hidden select-none">
    <!-- Index-driven track: translateX by whole viewports for deterministic nav -->
    <div
      class="flex h-full will-change-transform touch-pan-y"
      :class="{ 'transition-transform duration-300 ease-out': !dragging }"
      :style="{ transform: `translateX(calc(${-currentIndex * 100}% + ${dragDx}px))` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <slot />
    </div>

    <!-- Left tap area -->
    <button
      v-if="canGoBack"
      class="absolute left-0 top-0 h-full w-14 z-10 flex items-center justify-start pl-1 text-foreground/25 hover:text-foreground/50 bg-transparent"
      aria-label="Previous"
      @click="emit('navigate', -1)"
    >
      <span class="text-3xl leading-none">‹</span>
    </button>

    <!-- Right tap area -->
    <button
      v-if="canGoForward"
      class="absolute right-0 top-0 h-full w-14 z-10 flex items-center justify-end pr-1 text-foreground/25 hover:text-foreground/50 bg-transparent"
      aria-label="Next"
      @click="emit('navigate', 1)"
    >
      <span class="text-3xl leading-none">›</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  currentIndex: number;
  total: number;
}>();

const emit = defineEmits<{
  navigate: [delta: number];
}>();

const canGoBack = computed(() => props.currentIndex > 0);
const canGoForward = computed(() => props.currentIndex < props.total - 1);

// --- Horizontal swipe (pointer-based, threshold-driven) ---
const SWIPE_THRESHOLD = 60; // px to commit a page turn
const dragging = ref(false);
const dragDx = ref(0);
let startX = 0;
let startY = 0;
let horizontal = false;
let decided = false;

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  startX = e.clientX;
  startY = e.clientY;
  dragging.value = true;
  horizontal = false;
  decided = false;
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  // Decide gesture axis once past a small deadzone; let vertical scroll pass through.
  if (!decided && Math.abs(dx) + Math.abs(dy) > 8) {
    decided = true;
    horizontal = Math.abs(dx) > Math.abs(dy);
  }
  if (horizontal) {
    e.preventDefault();
    // Resist swiping past the ends.
    const atEnd = (dx < 0 && !canGoForward.value) || (dx > 0 && !canGoBack.value);
    dragDx.value = atEnd ? dx * 0.25 : dx;
  }
}

function onPointerUp() {
  if (!dragging.value) return;
  const dx = dragDx.value;
  dragging.value = false;
  dragDx.value = 0;
  if (horizontal && Math.abs(dx) > SWIPE_THRESHOLD) {
    emit("navigate", dx < 0 ? 1 : -1);
  }
}
</script>
