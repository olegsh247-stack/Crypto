FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY web/package.json ./package.json
RUN npm install
COPY web/ ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
EXPOSE 3000
CMD ["npm","run","start","--","-H","0.0.0.0"]
