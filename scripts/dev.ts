import { resolve } from "path";

const root = resolve(import.meta.dir, "..");
const appDir = resolve(root, "apps/app");
const C = { api: "\x1b[36m", vite: "\x1b[35m", sys: "\x1b[33m", r: "\x1b[0m" };

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

const api = Bun.spawn(["bun", "run", "src/server/index.ts"], {
  cwd: appDir,
  stdout: "pipe",
  stderr: "pipe",
});

const vite = Bun.spawn(["bunx", "vite"], {
  cwd: appDir,
  stdout: "pipe",
  stderr: "pipe",
});

pipe(api.stdout, `${C.api}[api] ${C.r}`);
pipe(api.stderr, `${C.api}[api] ${C.r}`);
pipe(vite.stdout, `${C.vite}[vite]${C.r} `);
pipe(vite.stderr, `${C.vite}[vite]${C.r} `);

function shutdown() {
  process.stdout.write(`\n${C.sys}[dev] shutting down...${C.r}\n`);
  api.kill();
  vite.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await Promise.all([api.exited, vite.exited]);
