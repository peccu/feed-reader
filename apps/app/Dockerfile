FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lockb* ./
COPY apps/app/package.json ./apps/app/
COPY packages/domain/package.json ./packages/domain/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# TODO: bun run build (Vue.js frontend)

FROM base
COPY --from=build /app .
EXPOSE 3000
CMD ["bun", "run", "apps/app/src/server/index.ts"]
