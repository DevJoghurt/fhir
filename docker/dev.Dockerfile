ARG NODE_VERSION=23.7.0

FROM node:${NODE_VERSION}-slim AS base

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Arbeitsverzeichnis
WORKDIR /app

COPY ./package.json ./pnpm-workspace.yaml ./pnpm-lock.yaml ./.npmrc ./
COPY ./packages/admin/package.json ./packages/admin/
COPY ./packages/app/package.json ./packages/app/
COPY ./packages/auth/package.json ./packages/auth/
COPY ./packages/cli/package.json ./packages/cli/
COPY ./packages/core/package.json ./packages/core/
COPY ./packages/profiling/package.json ./packages/profiling/
COPY ./packages/questionnaire/package.json ./packages/questionnaire/
COPY ./playground/demo/package.json ./playground/demo/
COPY ./playground/profiling/package.json ./playground/profiling/

# Install dependencies (ignores node_modules from bind mount)
RUN pnpm install

# Copy full source
COPY --link . .

# Dev-Vorbereitung ausführen
RUN pnpm run dev:prepare

CMD [ "pnpm", "demo:dev"]