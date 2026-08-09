import { defineStore } from "pinia";
import { computed, ref } from "vue";

/**
 * Global UI preferences. `direction` is the handedness / reading direction:
 * "forward" = right-hand (controls on the right, advance rightward),
 * "backward" = left-hand (mirrored). Persisted so it applies app-wide and
 * across sessions, and every floating control (menu / back) sits on the
 * thumb side accordingly.
 */
export const useUiStore = defineStore("ui", () => {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("handedness") : null;
  const direction = ref<"forward" | "backward">(stored === "backward" ? "backward" : "forward");

  /** Side (Tailwind class) for floating controls, following handedness. */
  const sideClass = computed(() => (direction.value === "forward" ? "right-3" : "left-3"));
  const reversed = computed(() => direction.value === "backward");

  function toggleDirection() {
    direction.value = direction.value === "forward" ? "backward" : "forward";
    if (typeof localStorage !== "undefined") localStorage.setItem("handedness", direction.value);
  }

  return { direction, reversed, sideClass, toggleDirection };
});
