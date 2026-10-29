FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY api/package.json ./api/
COPY api/package-lock.json ./api/
COPY shared/package.json ./shared/
COPY shared/package-lock.json ./shared/
COPY shared/src ./shared/src
COPY shared/tsconfig.json ./shared/
RUN cd shared && npm ci --install-links && npm run build
RUN cd api && npm ci --install-links
COPY api/tsconfig.json ./api/
COPY api/src ./api/src
RUN cd api && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/api/package.json ./package.json
COPY --from=build /app/api/node_modules ./node_modules
COPY --from=build /app/api/dist ./dist
EXPOSE 8080
CMD ["node","--enable-source-maps","dist/server.js"]
