FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY web/package.json ./web/package.json
RUN cd web && npm install
COPY web/ ./web/
COPY shared/ ./shared/
WORKDIR /app/web
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/web/package.json ./package.json
COPY --from=build /app/web/node_modules ./node_modules
COPY --from=build /app/web/.next ./.next
COPY --from=build /app/shared ./shared
EXPOSE 3000
CMD ["npm","run","start","--","-H","0.0.0.0"]
