FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY vps/api/package.json ./api/
COPY vps/shared ./shared
COPY data/CryptoDataModel/registry/metric-registry.json ./data/CryptoDataModel/registry/metric-registry.json
RUN cd shared && npm install && npm run build
RUN cd api && npm install
COPY vps/api/tsconfig.json ./api/
COPY vps/api/src ./api/src
RUN cd api && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/api/node_modules ./api/node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/data/CryptoDataModel/registry/metric-registry.json ./data/CryptoDataModel/registry/metric-registry.json
EXPOSE 8080
CMD ["node","--enable-source-maps","api/dist/server.js"]
