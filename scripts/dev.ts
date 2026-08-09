import { mkdirSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dir, "..");
const appDir = resolve(root, "apps/app");
const ingesterDir = resolve(root, "apps/ingester");
const workerDir = resolve(root, "apps/claude-worker");
const sessionsDir = resolve(root, "tmp/claude-sessions");

mkdirSync(sessionsDir, { recursive: true });

const DB_PATH = resolve(appDir, "feed-reader.db");

const C = {
  api: "\x1b[36m",
  vite: "\x1b[35m",
  ing: "\x1b[32m",
  wrk: "\x1b[33m",
  sys: "\x1b[90m",
  r: "\x1b[0m",
};

async function pipe(stream: ReadableStream<Uint8Array>, prefix: string) {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) process.stdout.write(`${prefix}${line}\n`);
    }
    if (buf) process.stdout.write(`${prefix}${buf}\n`);
  } catch {
    // stream closed
  }
}

const sharedEnv = {
  ...process.env,
  DB_PATH,
  CLAUDE_WORKER_URL: "http://localhost:3001",
};

const api = Bun.spawn(["bun", "run", "src/server/index.ts"], {
  cwd: appDir,
  stdout: "pipe",
  stderr: "pipe",
  env: sharedEnv,
});

const vite = Bun.spawn(["bunx", "vite"], {
  cwd: appDir,
  stdout: "pipe",
  stderr: "pipe",
  env: sharedEnv,
});

const ingester = Bun.spawn(["bun", "run", "src/index.ts"], {
  cwd: ingesterDir,
  stdout: "pipe",
  stderr: "pipe",
  env: sharedEnv,
});

const worker = Bun.spawn(["bun", "run", "src/index.ts"], {
  cwd: workerDir,
  stdout: "pipe",
  stderr: "pipe",
  env: { ...process.env, PORT: "3001", SESSIONS_DIR: sessionsDir },
});

pipe(api.stdout, `${C.api}[api]     ${C.r}`);
pipe(api.stderr, `${C.api}[api]     ${C.r}`);
pipe(vite.stdout, `${C.vite}[vite]    ${C.r}`);
pipe(vite.stderr, `${C.vite}[vite]    ${C.r}`);
pipe(ingester.stdout, `${C.ing}[ingester]${C.r}`);
pipe(ingester.stderr, `${C.ing}[ingester]${C.r}`);
pipe(worker.stdout, `${C.wrk}[worker]  ${C.r}`);
pipe(worker.stderr, `${C.wrk}[worker]  ${C.r}`);

function shutdown() {
  process.stdout.write(`\n${C.sys}[dev] shutting down...${C.r}\n`);
  api.kill();
  vite.kill();
  ingester.kill();
  worker.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await Promise.all([api.exited, vite.exited, ingester.exited, worker.exited]);
