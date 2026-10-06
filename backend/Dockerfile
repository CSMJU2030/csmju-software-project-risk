FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build_only

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter backend...

COPY backend/ backend/
RUN pnpm --filter backend exec prisma generate \\
 && pnpm --filter backend build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --prod --filter backend... --ignore-scripts \\
 && pnpm store prune

COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
COPY backend/docker/entrypoint.sh ./backend/docker/entrypoint.sh

RUN chmod +x ./backend/docker/entrypoint.sh && chown -R node:node /app
USER node
WORKDIR /app/backend

EXPOSE 4232
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
