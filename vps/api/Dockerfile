FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY api/package.json api/package-lock.json ./api/
COPY shared/package.json shared/package-lock.json ./shared/
COPY shared ./shared
RUN cd shared && npm ci && npm run build
RUN cd api && npm ci
COPY api/tsconfig.json ./api/
COPY api/src ./api/src
RUN cd api && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/shared ./shared
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/api/node_modules ./api/node_modules
COPY --from=build /app/api/dist ./api/dist
EXPOSE 8080
WORKDIR /app/api
CMD ["node","--enable-source-maps","dist/server.js"]
