<template>
  <div class="h-full flex flex-col bg-background relative">
    <BackButton />
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <h1 class="text-base font-semibold flex-1">Notes</h1>
      <span class="text-xs text-muted-foreground">{{ notes.length }}</span>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- When arriving from an article's note indicator, show only that
           article's notes with a way back to the full list. -->
      <div
        v-if="articleId"
        class="flex items-center justify-between gap-2 text-xs text-muted-foreground"
      >
        <span>Notes for this article</span>
        <RouterLink to="/notes" class="text-primary underline underline-offset-2">Show all notes</RouterLink>
      </div>

      <RouterLink
        v-for="note in notes"
        :key="note.id"
        :to="`/notes/${note.id}`"
        class="block p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
      >
        <p class="text-sm text-foreground whitespace-pre-wrap line-clamp-3">{{ note.content }}</p>
        <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{{ formatDate(note.createdAt) }}</span>
          <span class="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
            {{ note.noteType === 'claude_conversation' ? 'claude' : note.noteType }}
          </span>
        </div>
      </RouterLink>
      <p v-if="notes.length === 0" class="text-sm text-muted-foreground text-center py-8">
        {{ articleId ? 'No notes for this article' : 'No notes yet' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteResponse } from "@feed-reader/types";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api/client.ts";
import BackButton from "../components/BackButton.vue";

const route = useRoute();
const notes = ref<NoteResponse[]>([]);
const articleId = computed(() =>
  typeof route.query.article === "string" ? route.query.article : undefined,
);

async function load() {
  const path = articleId.value
    ? `/notes?articleId=${encodeURIComponent(articleId.value)}`
    : "/notes";
  const res = await api.get<{ items: NoteResponse[] }>(path);
  notes.value = res.items;
}

// Reload when the article filter changes (and on first mount).
watch(articleId, load, { immediate: true });

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>
