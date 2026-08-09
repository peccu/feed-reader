import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export default async function globalSetup() {
  // Build the Vue frontend if the dist isn't present
  const distIndex = "apps/app/dist/client/index.html";
  if (!existsSync(distIndex)) {
    console.log("[globalSetup] Building Vue frontend...");
    execSync("bun --cwd apps/app run build", { stdio: "inherit" });
  }
}
