<template>
  <div
    class="flex items-center justify-around px-2 py-2 border-t border-border bg-background"
    style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom))"
  >
    <button
      v-for="btn in orderedButtons"
      :key="btn.type"
      @click="emit('action', btn.type)"
      :disabled="disabled"
      :class="[
        'flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-lg transition-colors disabled:opacity-40',
        isActive(btn.type) ? btn.activeClass : btn.class,
      ]"
      :aria-label="btn.label"
      :title="btn.title"
      :aria-pressed="isActive(btn.type)"
    >
      <component :is="btn.icon" :size="22" :stroke-width="2" />
      <span class="text-[11px] font-medium">{{ btn.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Bookmark, Check, SkipForward, StickyNote, ThumbsDown, ThumbsUp } from "lucide-vue-next";
import { type Component, computed } from "vue";

type ActionType = "dislike" | "like" | "done" | "skip" | "note" | "favorite";

const props = defineProps<{
  disabled?: boolean;
  /** Current evaluation for the visible article, to highlight like/dislike. */
  evaluation?: "like" | "dislike" | null;
  /** Whether the visible article is bookmarked, to highlight the save button. */
  favorited?: boolean;
  /** Mirror the button order to match left-hand (reversed) reading direction. */
  reversed?: boolean;
}>();
const emit = defineEmits<{ action: [type: ActionType] }>();

// Right-hand order (left→right): Note, Dislike, Like, Read, Save, Skip.
// Left-hand mode mirrors it.
const orderedButtons = computed(() => (props.reversed ? [...buttons].reverse() : buttons));

function isActive(type: ActionType): boolean {
  if (type === "favorite") return !!props.favorited;
  return (type === "like" || type === "dislike") && props.evaluation === type;
}

const buttons: Array<{
  type: ActionType;
  label: string;
  title: string;
  icon: Component;
  class: string;
  activeClass: string;
}> = [
  {
    type: "note",
    label: "Note",
    title: "Add a note about this article",
    icon: StickyNote,
    class: "text-muted-foreground hover:text-primary",
    activeClass: "text-primary",
  },
  {
    type: "dislike",
    label: "Dislike",
    title: "Dislike — train the preference vector down (stays in the queue)",
    icon: ThumbsDown,
    class: "text-muted-foreground hover:text-destructive",
    activeClass: "text-destructive",
  },
  {
    type: "like",
    label: "Like",
    title: "Like — train the preference vector up (stays in the queue)",
    icon: ThumbsUp,
    class: "text-muted-foreground hover:text-yellow-500",
    activeClass: "text-yellow-500",
  },
  {
    type: "done",
    label: "Read",
    title: "Mark as read — remove from the unread queue",
    icon: Check,
    class: "text-muted-foreground hover:text-green-600",
    activeClass: "text-green-600",
  },
  {
    type: "favorite",
    label: "Save",
    title: "Bookmark — save to Library › Favorites (independent of Like)",
    icon: Bookmark,
    class: "text-muted-foreground hover:text-amber-500",
    activeClass: "text-amber-500",
  },
  {
    type: "skip",
    label: "Skip",
    title: "Skip for now — remove from the unread queue without reading",
    icon: SkipForward,
    class: "text-muted-foreground hover:text-foreground",
    activeClass: "text-foreground",
  },
];
</script>
