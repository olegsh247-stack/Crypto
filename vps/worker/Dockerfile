FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY worker/package.json ./worker/
COPY shared ./shared
RUN cd worker && npm install
COPY worker/tsconfig.json ./worker/
COPY worker/src ./worker/src
RUN cd worker && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/worker/package.json ./package.json
COPY --from=build /app/worker/node_modules ./node_modules
COPY --from=build /app/worker/dist ./dist
CMD ["node","--enable-source-maps","dist/index.js"]
