FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS build
# Install with manifests first for layer caching, then build against the real
# workspace layout. Installing in the build stage (rather than copying
# node_modules from a separate deps stage) ensures Bun's workspace hoisting
# resolves correctly when `vite build` runs from apps/app.
COPY package.json bun.lock* ./
COPY apps/app/package.json ./apps/app/
COPY apps/ingester/package.json ./apps/ingester/
COPY apps/claude-worker/package.json ./apps/claude-worker/
COPY packages/domain/package.json ./packages/domain/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN bun install --frozen-lockfile
COPY . .
RUN bun run --cwd apps/app build

FROM base
COPY --from=build /app .
EXPOSE 3000
CMD ["bun", "run", "apps/app/src/server/index.ts"]
