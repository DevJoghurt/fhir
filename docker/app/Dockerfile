ARG NODE_VERSION=20.17.0

FROM node:${NODE_VERSION}-slim AS base

ARG PORT=3030

WORKDIR /app

# Build
FROM base AS build

COPY --link . .

RUN npm install

# Run
FROM base

ENV PORT=$PORT

COPY --from=build /app /app

CMD [ "node", "server.js" ]