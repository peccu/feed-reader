FROM oven/bun:1 AS base
WORKDIR /app

# claude CLI をインストール
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://claude.ai/install.sh | sh || true

FROM base AS deps
COPY package.json bun.lockb* ./
COPY apps/claude-worker/package.json ./apps/claude-worker/
COPY packages/types/package.json ./packages/types/
RUN bun install --frozen-lockfile

FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["bun", "run", "apps/claude-worker/src/index.ts"]
