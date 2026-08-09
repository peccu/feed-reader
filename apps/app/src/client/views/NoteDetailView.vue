<template>
  <div class="h-full flex flex-col bg-background">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/notes" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold flex-1">Note</h1>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <p class="text-sm text-foreground whitespace-pre-wrap">{{ note?.content ?? "Loading..." }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteResponse } from "@feed-reader/types";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api/client.ts";

const route = useRoute();
const note = ref<NoteResponse | null>(null);

onMounted(async () => {
  note.value = await api.get<NoteResponse>(`/notes/${route.params.id}`);
});
</script>
