FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY vps/worker/package.json ./worker/
COPY vps/shared ./shared
COPY data/CryptoDataModel/registry/metric-registry.json ./data/CryptoDataModel/registry/metric-registry.json
RUN cd shared && npm install && npm run build
RUN cd worker && npm install
COPY vps/worker/tsconfig.json ./worker/
COPY vps/worker/src ./worker/src
RUN cd worker && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/worker/package.json ./package.json
COPY --from=build /app/worker/node_modules ./node_modules
COPY --from=build /app/worker/dist ./dist
COPY --from=build /app/data/CryptoDataModel/registry/metric-registry.json ./data/CryptoDataModel/registry/metric-registry.json
CMD ["node","--enable-source-maps","dist/index.js"]
