import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router/index.ts";
import "./style.css";

// Follow the OS light/dark preference so the app background (and the PWA
// status bar via theme-color) match the device.
const darkMq = window.matchMedia("(prefers-color-scheme: dark)");
const applyDark = () => document.documentElement.classList.toggle("dark", darkMq.matches);
applyDark();
darkMq.addEventListener("change", applyDark);

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
