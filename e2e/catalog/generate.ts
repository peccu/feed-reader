#!/usr/bin/env bun
/**
 * Screen catalog generator.
 *
 * Boots the seeded E2E server, walks every screen/state of the SPA in both a
 * mobile and a desktop viewport, captures a screenshot of each, and emits a
 * self-contained `screens/index.html` gallery plus `screens/manifest.json`.
 *
 * Run: `bun run catalog` (from repo root). Used by the docs site build, which
 * publishes `screens/` to GitHub Pages.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { type Page, chromium, devices } from "@playwright/test";

const ROOT = process.cwd();
const OUT = `${ROOT}/screens`;
const BASE = "http://localhost:3737";

interface Screen {
  id: string;
  name: string;
  route: string;
  description: string;
  setup?: (page: Page) => Promise<void>;
}

const screens: Screen[] = [
  {
    id: "queue",
    name: "Unread queue (carousel)",
    route: "/",
    description:
      "The main screen. Work through unread articles, highest score first, in a horizontal carousel. Tap the left/right edge or swipe to move between articles, tap the position indicator at the top to flip the reading direction, and use the bottom action bar to skip / like / take a note.",
    setup: async (page) => {
      // Wait until the first seeded article renders inside the carousel.
      await page.getByText("TypeScript Advances").first().waitFor({ state: "visible" });
    },
  },
  {
    id: "reader",
    name: "Reader (full text)",
    route: "/reader/e2e-art-0",
    description:
      "Full-screen in-app reader. Read the article body without leaving for the original site, and record like / not-interested / note actions from the bottom bar.",
  },
  {
    id: "reader-note",
    name: "Reader: note entry",
    route: "/reader/e2e-art-0?note=1",
    description:
      "The reader with the note entry form open, for capturing a quote or comment about the article.",
    setup: async (page) => {
      await page.getByText("Add note").waitFor({ state: "visible" });
    },
  },
  {
    id: "discover",
    name: "Discover (search, initial)",
    route: "/discover",
    description:
      "Search and exploration screen. It tries vector search first (sqlite-vec KNN) and falls back to full-text LIKE search on failure. Shown here in its initial state.",
  },
  {
    id: "discover-results",
    name: "Discover: search results",
    route: "/discover",
    description:
      "After running a keyword search. Each result shows a similarity score (for vector search) and a vector/text mode badge, and tapping it opens the reader.",
    setup: async (page) => {
      const box = page.getByRole("searchbox");
      await box.waitFor({ state: "visible" });
      await box.fill("TypeScript");
      await box.press("Enter");
      await page.getByText("TypeScript Advances").first().waitFor({ state: "visible" });
    },
  },
  {
    id: "notes",
    name: "Notes list",
    route: "/notes",
    description:
      "A list of saved notes. Each note links back to the reader for the article it came from.",
  },
  {
    id: "note-detail",
    name: "Note detail",
    route: "/notes/e2e-note-1",
    description: "A single note: its Markdown body, type, and the related article.",
  },
  {
    id: "categories",
    name: "Categories (empty state)",
    route: "/categories",
    description:
      "Category management. Lists auto-clustered categories (Auto badge) and manual ones, and supports create / edit / delete. Shown here with no categories yet.",
  },
  {
    id: "categories-new",
    name: "Categories: new category form",
    route: "/categories",
    description: 'The new-category form (name, description, colour) opened via "+ Add".',
    setup: async (page) => {
      await page.getByRole("button", { name: "Add" }).click();
      await page.getByText("New Category").waitFor({ state: "visible" });
    },
  },
  {
    id: "settings",
    name: "Settings / feed management",
    route: "/settings",
    description:
      "Settings: add / list / delete feeds, manually submit a URL or HTML, adjust the preference profile (learning rate), and see the status of ingest jobs.",
  },
];

const viewports = [
  { key: "mobile", label: "Mobile (Pixel 7)", opts: devices["Pixel 7"] },
  { key: "desktop", label: "Desktop Chrome", opts: devices["Desktop Chrome"] },
] as const;

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    if (Date.now() > deadline) throw new Error(`server did not become healthy: ${url}`);
    await Bun.sleep(300);
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(): string {
  const cards = screens
    .map((s, i) => {
      const shots = viewports
        .map(
          (vp) => `
        <figure class="shot">
          <figcaption>${vp.label}</figcaption>
          <a href="${vp.key}/${s.id}.png" target="_blank" rel="noopener">
            <img src="${vp.key}/${s.id}.png" alt="${esc(s.name)} — ${vp.label}" loading="lazy" />
          </a>
        </figure>`,
        )
        .join("");
      return `
      <section class="card" id="${s.id}">
        <div class="meta">
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
          <h2>${esc(s.name)}</h2>
          <code class="route">${esc(s.route)}</code>
          <p class="desc">${esc(s.description)}</p>
        </div>
        <div class="shots">${shots}</div>
      </section>`;
    })
    .join("");

  const nav = screens
    .map((s, i) => `<a href="#${s.id}">${String(i + 1).padStart(2, "0")}. ${esc(s.name)}</a>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Feed Reader — Screen Catalog</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6; color: #1a1a1a; background: #f6f7f9; }
  header.top { padding: 24px 32px; background: #111827; color: #fff; }
  header.top h1 { margin: 0 0 4px; font-size: 20px; }
  header.top p { margin: 0; font-size: 13px; opacity: .8; }
  .layout { display: grid; grid-template-columns: 260px 1fr; align-items: start; }
  nav.toc { position: sticky; top: 0; max-height: 100vh; overflow: auto; padding: 20px; font-size: 13px; border-right: 1px solid #e5e7eb; background: #fff; }
  nav.toc a { display: block; padding: 6px 8px; border-radius: 6px; color: #374151; text-decoration: none; }
  nav.toc a:hover { background: #f3f4f6; }
  main { padding: 24px 32px 80px; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
  .meta { margin-bottom: 16px; }
  .num { display: inline-block; font-variant-numeric: tabular-nums; font-weight: 700; color: #6366f1; margin-right: 8px; }
  .meta h2 { display: inline; font-size: 18px; margin: 0; }
  .route { display: inline-block; margin-left: 10px; padding: 2px 8px; border-radius: 6px; background: #eef2ff; color: #4338ca; font-size: 12px; }
  .desc { margin: 10px 0 0; font-size: 14px; color: #4b5563; max-width: 70ch; }
  .shots { display: flex; flex-wrap: wrap; gap: 20px; }
  figure.shot { margin: 0; }
  figure.shot figcaption { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  figure.shot img { display: block; border: 1px solid #d1d5db; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.08); background: #fff; }
  figure.shot img { max-height: 640px; width: auto; }
  @media (prefers-color-scheme: dark) {
    body { background: #0b0f19; color: #e5e7eb; }
    nav.toc { background: #111827; border-color: #1f2937; }
    nav.toc a { color: #cbd5e1; }
    nav.toc a:hover { background: #1f2937; }
    .card { background: #111827; border-color: #1f2937; }
    .desc { color: #9ca3af; }
    .route { background: #1e1b4b; color: #a5b4fc; }
  }
</style>
</head>
<body>
<header class="top">
  <h1>Feed Reader — Screen Catalog</h1>
  <p><a href="../index.html" style="color:#a5b4fc">← Docs home</a> · Auto-generated with Playwright · ${screens.length} screens × ${viewports.length} viewports · ${new Date().toISOString()}</p>
</header>
<div class="layout">
  <nav class="toc">${nav}</nav>
  <main>${cards}</main>
</div>
</body>
</html>`;
}

async function main() {
  // Ensure the frontend is built (mirrors e2e/globalSetup.ts).
  if (!existsSync(`${ROOT}/apps/app/dist/client/index.html`)) {
    console.log("[catalog] building frontend...");
    execSync("bun run --cwd apps/app build", { stdio: "inherit" });
  }

  rmSync(OUT, { recursive: true, force: true });
  for (const vp of viewports) mkdirSync(`${OUT}/${vp.key}`, { recursive: true });

  console.log("[catalog] starting seeded E2E server...");
  const server = Bun.spawn(["bun", "run", "e2e/server/start.ts"], {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });

  const failures: string[] = [];
  try {
    await waitForHealth(`${BASE}/health`, 60_000);
    const browser = await chromium.launch();

    for (const vp of viewports) {
      const context = await browser.newContext({ ...vp.opts });
      for (const screen of screens) {
        const page = await context.newPage();
        // Fail fast on missing elements — a broken screen must not stall the run.
        page.setDefaultTimeout(10_000);
        try {
          try {
            await page.goto(`${BASE}${screen.route}`, {
              waitUntil: "networkidle",
              timeout: 15_000,
            });
          } catch {
            await page.goto(`${BASE}${screen.route}`, { waitUntil: "load", timeout: 15_000 });
          }
          if (screen.setup) await screen.setup(page);
          await page.waitForTimeout(400);
          await page.screenshot({ path: `${OUT}/${vp.key}/${screen.id}.png` });
          console.log(`[catalog] captured ${vp.key}/${screen.id}`);
        } catch (err) {
          // Best-effort: still capture whatever rendered, then keep going.
          failures.push(`${vp.key}/${screen.id}: ${(err as Error).message.split("\n")[0]}`);
          await page.screenshot({ path: `${OUT}/${vp.key}/${screen.id}.png` }).catch(() => {});
          console.warn(`[catalog] FAILED ${vp.key}/${screen.id} — captured current state`);
        } finally {
          await page.close();
        }
      }
      await context.close();
    }

    await browser.close();
  } finally {
    server.kill();
  }

  writeFileSync(
    `${OUT}/manifest.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        viewports: viewports.map((v) => ({ key: v.key, label: v.label })),
        screens: screens.map(({ id, name, route, description }) => ({
          id,
          name,
          route,
          description,
        })),
      },
      null,
      2,
    ),
  );
  writeFileSync(`${OUT}/index.html`, buildHtml());
  console.log(`[catalog] done → ${OUT}/index.html`);

  if (failures.length > 0) {
    console.warn(`[catalog] ${failures.length} screen(s) captured with errors:`);
    for (const f of failures) console.warn(`  - ${f}`);
  }
}

await main();
