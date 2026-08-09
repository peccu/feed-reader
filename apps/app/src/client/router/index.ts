import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("../views/QueueView.vue") },
    { path: "/reader/:id", component: () => import("../views/ReaderView.vue") },
    { path: "/discover", component: () => import("../views/DiscoverView.vue") },
    { path: "/library", component: () => import("../views/LibraryView.vue") },
    { path: "/train", component: () => import("../views/TrainingView.vue") },
    { path: "/admin", component: () => import("../views/AdminView.vue") },
    { path: "/notes", component: () => import("../views/NotesView.vue") },
    { path: "/notes/:id", component: () => import("../views/NoteDetailView.vue") },
    { path: "/categories", component: () => import("../views/CategoryView.vue") },
    { path: "/settings", component: () => import("../views/SettingsView.vue") },
  ],
});
