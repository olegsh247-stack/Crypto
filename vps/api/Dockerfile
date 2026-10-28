FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY api/package.json ./api/
COPY shared ./shared
RUN cd shared && npm install && npm run build
RUN cd api && npm install
COPY api/tsconfig.json ./api/
COPY api/src ./api/src
RUN cd api && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# Preserve the build-time directory layout so file:../shared resolves to /app/shared.
COPY --from=build /app/shared ./shared
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/api/node_modules ./api/node_modules
COPY --from=build /app/api/dist ./api/dist
EXPOSE 8080
WORKDIR /app/api
CMD ["node","--enable-source-maps","dist/server.js"]
