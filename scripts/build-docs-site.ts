#!/usr/bin/env bun
/**
 * Assembles the documentation site published to GitHub Pages.
 *
 * Inputs (produced by the other docs steps, run first):
 *   - `site/api/`   — TypeDoc "Domain & API Reference" (`bun run docs:api`)
 *   - `screens/`    — Playwright screen catalog          (`bun run catalog`)
 *
 * Output: a self-contained `site/` directory with a landing page that links to
 * both, ready to deploy. Run the whole chain with `bun run docs`.
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const ROOT = process.cwd();
const SITE = `${ROOT}/site`;
const REPO = "https://github.com/peccu/feed-reader/blob/v2/docs";

mkdirSync(SITE, { recursive: true });

// Copy the screen catalog into the site (the catalog links back to ../index.html).
const hasScreens = existsSync(`${ROOT}/screens/index.html`);
if (hasScreens) {
  cpSync(`${ROOT}/screens`, `${SITE}/screens`, { recursive: true });
  console.log("[docs-site] copied screens/ -> site/screens/");
} else {
  console.warn("[docs-site] screens/ not found — run `bun run catalog` first");
}

const hasApi = existsSync(`${SITE}/api/index.html`);
if (!hasApi) console.warn("[docs-site] site/api not found — run `bun run docs:api` first");

// GitHub Pages: skip Jekyll so TypeDoc's asset folders (some with leading
// underscores) are served verbatim.
writeFileSync(`${SITE}/.nojekyll`, "");

const generatedAt = new Date().toISOString();

const card = (href: string, title: string, body: string, enabled: boolean) =>
  enabled
    ? `<a class="card" href="${href}"><h2>${title} <span class="arrow">→</span></h2><p>${body}</p></a>`
    : `<div class="card disabled"><h2>${title}</h2><p>${body}</p><p class="note">Not generated in this build.</p></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Feed Reader — Documentation</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6; color: #1a1a1a; background: #f6f7f9; }
  header { padding: 40px 32px 28px; background: #111827; color: #fff; }
  header h1 { margin: 0 0 6px; font-size: 24px; }
  header p { margin: 0; font-size: 14px; opacity: .8; }
  main { max-width: 900px; margin: 0 auto; padding: 32px; }
  .cards { display: grid; gap: 18px; }
  .card { display: block; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 22px 24px; text-decoration: none; color: inherit; transition: box-shadow .15s, transform .15s; }
  a.card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.08); transform: translateY(-1px); }
  .card h2 { margin: 0 0 6px; font-size: 18px; }
  .card .arrow { color: #6366f1; }
  .card p { margin: 0; font-size: 14px; color: #4b5563; }
  .card.disabled { opacity: .55; }
  .card .note { margin-top: 8px; font-size: 12px; color: #9ca3af; }
  h3.section { margin: 34px 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
  ul.links { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 10px; }
  ul.links a { font-size: 13px; padding: 6px 12px; border-radius: 999px; background: #eef2ff; color: #4338ca; text-decoration: none; }
  footer { max-width: 900px; margin: 0 auto; padding: 0 32px 60px; font-size: 12px; color: #9ca3af; }
  @media (prefers-color-scheme: dark) {
    body { background: #0b0f19; color: #e5e7eb; }
    .card { background: #111827; border-color: #1f2937; }
    .card p { color: #9ca3af; }
    ul.links a { background: #1e1b4b; color: #a5b4fc; }
  }
</style>
</head>
<body>
<header>
  <h1>Feed Reader — Documentation</h1>
  <p>A personal content-filtering feed reader. Generated ${generatedAt}.</p>
</header>
<main>
  <div class="cards">
    ${card("api/index.html", "Domain Model &amp; API Reference", "A plain-language guide to the DDD model under <code>packages/</code>, followed by the full auto-generated TypeDoc reference of every type, class, and interface.", hasApi)}
    ${card("screens/index.html", "Screen Catalog", "A screenshot of every screen and state of the app, in mobile and desktop viewports, each with a description of what it does.", hasScreens)}
  </div>
  <h3 class="section">Design documents</h3>
  <ul class="links">
    <li><a href="${REPO}/domain-model.md">Domain model</a></li>
    <li><a href="${REPO}/architecture.md">Architecture</a></li>
    <li><a href="${REPO}/requirements.md">Requirements</a></li>
    <li><a href="${REPO}/screen-flow.md">Screen flow</a></li>
    <li><a href="${REPO}/tasks.md">Tasks / roadmap</a></li>
  </ul>
</main>
<footer>Built from the source tree with TypeDoc and Playwright. See <a href="https://github.com/peccu/feed-reader">the repository</a>.</footer>
</body>
</html>`;

writeFileSync(`${SITE}/index.html`, html);
console.log(`[docs-site] wrote site/index.html (api=${hasApi}, screens=${hasScreens})`);
