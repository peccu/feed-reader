<template>
  <div
    class="flex items-center justify-around px-4 py-2 border-t border-border bg-background"
    style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom))"
  >
    <button
      v-for="btn in buttons"
      :key="btn.type"
      @click="emit('action', btn.type)"
      :disabled="disabled"
      :class="[
        'flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-colors disabled:opacity-40',
        btn.class,
      ]"
      :aria-label="btn.label"
    >
      <component :is="btn.icon" :size="22" :stroke-width="2" />
      <span class="text-[11px] font-medium">{{ btn.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { SkipForward, StickyNote, ThumbsDown, ThumbsUp } from "lucide-vue-next";
import type { Component } from "vue";

type ActionType = "skip" | "dislike" | "like" | "note";

defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ action: [type: ActionType] }>();

const buttons: Array<{ type: ActionType; label: string; icon: Component; class: string }> = [
  {
    type: "skip",
    label: "Skip",
    icon: SkipForward,
    class: "text-muted-foreground hover:text-foreground",
  },
  {
    type: "dislike",
    label: "Not interested",
    icon: ThumbsDown,
    class: "text-muted-foreground hover:text-destructive",
  },
  {
    type: "like",
    label: "Like",
    icon: ThumbsUp,
    class: "text-muted-foreground hover:text-yellow-500",
  },
  {
    type: "note",
    label: "Note",
    icon: StickyNote,
    class: "text-muted-foreground hover:text-primary",
  },
];
</script>
