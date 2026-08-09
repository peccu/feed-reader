<template>
  <div class="h-full flex flex-col bg-background">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold flex-1">Notes</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div
        v-for="note in notes"
        :key="note.id"
        class="p-3 rounded-lg border border-border bg-card"
      >
        <p class="text-sm text-foreground whitespace-pre-wrap line-clamp-3">{{ note.content }}</p>
        <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{{ new Date(note.createdAt).toLocaleDateString('en-US') }}</span>
          <span
            class="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
          >{{ note.noteType }}</span>
        </div>
      </div>
      <p v-if="notes.length === 0" class="text-sm text-muted-foreground text-center py-8">
        No notes yet
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteResponse } from "@feed-reader/types";
import { onMounted, ref } from "vue";
import { api } from "../api/client.ts";

const notes = ref<NoteResponse[]>([]);

onMounted(async () => {
  const res = await api.get<{ items: NoteResponse[] }>("/notes");
  notes.value = res.items;
});
</script>
