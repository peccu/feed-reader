<template>
  <div
    class="flex items-center justify-around px-4 py-3 border-t border-border bg-background safe-area-bottom"
    style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
  >
    <!-- Skip -->
    <button
      @click="emit('action', 'skip')"
      class="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors py-1 px-3 rounded-lg"
      :disabled="disabled"
    >
      <span class="text-xl">⏭</span>
      <span class="text-xs">スキップ</span>
    </button>

    <!-- Dislike -->
    <button
      @click="emit('action', 'dislike')"
      class="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive transition-colors py-1 px-3 rounded-lg"
      :disabled="disabled"
    >
      <span class="text-xl">👎</span>
      <span class="text-xs">興味なし</span>
    </button>

    <!-- Read full article -->
    <button
      @click="emit('action', 'read')"
      class="flex flex-col items-center gap-1 bg-primary text-primary-foreground py-1 px-4 rounded-lg"
      :disabled="disabled"
    >
      <span class="text-xl">📖</span>
      <span class="text-xs font-medium">全文</span>
    </button>

    <!-- Like -->
    <button
      @click="emit('action', 'like')"
      class="flex flex-col items-center gap-1 text-muted-foreground hover:text-yellow-500 transition-colors py-1 px-3 rounded-lg"
      :disabled="disabled"
    >
      <span class="text-xl">👍</span>
      <span class="text-xs">いいね</span>
    </button>

    <!-- Note -->
    <button
      @click="emit('action', 'note')"
      class="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors py-1 px-3 rounded-lg"
      :disabled="disabled"
    >
      <span class="text-xl">📝</span>
      <span class="text-xs">メモ</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{
  action: [type: "skip" | "like" | "dislike" | "read" | "note"];
}>();
</script>
