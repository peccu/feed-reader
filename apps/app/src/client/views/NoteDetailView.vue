<template>
  <div class="h-full flex flex-col bg-background relative">
    <BackButton to="/notes" />
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <h1 class="text-base font-semibold flex-1">Note</h1>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="note">
        <div class="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <span class="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
            {{ note.noteType === 'claude_conversation' ? 'claude' : note.noteType }}
          </span>
          <span>{{ formatDate(note.createdAt) }}</span>
        </div>
        <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{{ note.content }}</p>
        <RouterLink
          :to="`/reader/${note.articleId}`"
          class="inline-block mt-6 text-sm text-primary underline underline-offset-4"
        >Open the source article →</RouterLink>
      </div>
      <p v-else class="text-sm text-muted-foreground">Loading…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteResponse } from "@feed-reader/types";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api/client.ts";
import BackButton from "../components/BackButton.vue";

const route = useRoute();
const note = ref<NoteResponse | null>(null);

onMounted(async () => {
  note.value = await api.get<NoteResponse>(`/notes/${route.params.id}`);
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>
