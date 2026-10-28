FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY worker/package.json ./worker/
COPY shared ./shared
RUN cd shared && npm install && npm run build
RUN cd worker && npm install
COPY worker/tsconfig.json ./worker/
COPY worker/src ./worker/src
RUN cd worker && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# Preserve the build-time directory layout so file:../shared resolves to /app/shared.
COPY --from=build /app/shared ./shared
COPY --from=build /app/worker/package.json ./worker/package.json
COPY --from=build /app/worker/node_modules ./worker/node_modules
COPY --from=build /app/worker/dist ./worker/dist
WORKDIR /app/worker
CMD ["node","--enable-source-maps","dist/index.js"]
