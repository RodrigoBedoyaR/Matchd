# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the whole monorepo (minus node_modules/dist/.git per .dockerignore).
# `npm install` needs every workspace's package.json present to resolve the
# lockfile correctly — copying only apps/api + packages/shared silently
# breaks devDependency installation (e.g. the `prisma` CLI binary go missing).
COPY . .

# Install dependencies at the root (resolves workspace links)
RUN npm install

# Generate Prisma client. Run via the workspace's own script rather than a
# bare `npx prisma` from the repo root — npm workspaces don't hoist the
# `prisma` CLI binary to the root node_modules/.bin, only to
# apps/api/node_modules/.bin, and `npx` run from root won't find it there.
RUN npm run db:generate --workspace apps/api

# Build the shared package (compiled JS, not raw TS — plain `node` in the
# runtime stage can't import a .ts file the way `tsx`/Vite do in dev) and the API.
RUN npm run build --workspace packages/shared
RUN npm run build --workspace apps/api

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules from builder — both the hoisted root tree AND apps/api's
# own node_modules, since npm workspaces does NOT hoist every binary (the
# `prisma` CLI only lands in apps/api/node_modules/.bin here).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# package.json files, needed for `npm run --workspace` resolution at runtime
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Built application code
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Prisma schema and migrations
COPY apps/api/prisma ./apps/api/prisma

# Expose the port (Railway will override via PORT env var at runtime)
EXPOSE 4000

# Run migrations then start the server. Uses the workspace's own npm script
# (not a bare `npx prisma`) for the same hoisting reason as the build stage.
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npm run db:migrate:deploy --workspace apps/api && node apps/api/dist/index.js"]
