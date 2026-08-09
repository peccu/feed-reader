<template>
  <div class="h-full relative">
    <ArticleFeed
      :items="items"
      list-key="unread"
      list-label="Unread"
      empty-text="Queue is empty — open the menu to add a feed or submit a URL"
    />

    <!-- Floating menu button (bottom, thumb zone; follows handedness) -->
    <button
      @click="showMenu = true"
      aria-label="Menu"
      class="absolute z-40 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl ring-1 ring-black/5 active:scale-95 transition-transform"
      :class="ui.sideClass"
      style="bottom: calc(env(safe-area-inset-bottom) + 4.75rem)"
    >
      <Menu :size="20" />
    </button>

    <!-- Navigation menu (bottom sheet) -->
    <div v-if="showMenu" class="absolute inset-0 z-50" @click.self="showMenu = false">
      <div class="absolute inset-0 bg-black/40" @click="showMenu = false" />
      <nav
        class="absolute left-0 right-0 bottom-0 bg-background border-t border-border rounded-t-2xl p-2"
        style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
      >
        <button
          @click="ui.toggleDirection()"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground"
        >
          <ArrowLeftRight :size="20" class="text-muted-foreground" />
          <span class="text-sm font-medium flex-1 text-left">Direction</span>
          <span class="text-xs text-muted-foreground">
            {{ ui.direction === 'forward' ? 'Right-hand' : 'Left-hand' }}
          </span>
        </button>

        <div class="my-1 border-t border-border" />

        <RouterLink
          v-for="link in menuLinks"
          :key="link.to"
          :to="link.to"
          @click="showMenu = false"
          class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground"
        >
          <component :is="link.icon" :size="20" class="text-muted-foreground" />
          <span class="text-sm font-medium">{{ link.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QueueListItemResponse } from "@feed-reader/types";
import {
  ArrowLeftRight,
  Compass,
  Gauge,
  Library,
  Menu,
  NotebookText,
  Settings,
  Tags,
  Target,
} from "lucide-vue-next";
import { type Component, onMounted, ref } from "vue";
import { api } from "../api/client.ts";
import ArticleFeed from "../components/ArticleFeed.vue";
import { useUiStore } from "../stores/ui.ts";

const ui = useUiStore();
const items = ref<QueueListItemResponse[]>([]);
const showMenu = ref(false);

const menuLinks: Array<{ to: string; label: string; icon: Component }> = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/feed/training", label: "Train", icon: Target },
  { to: "/library", label: "Library", icon: Library },
  { to: "/notes", label: "Notes", icon: NotebookText },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/settings", label: "Settings / Feeds", icon: Settings },
  { to: "/admin", label: "Admin / Status", icon: Gauge },
];

onMounted(async () => {
  const res = await api.get<{ items: QueueListItemResponse[] }>(
    "/queue/list?status=unread&sort=relevance",
  );
  items.value = res.items;
});
</script>
