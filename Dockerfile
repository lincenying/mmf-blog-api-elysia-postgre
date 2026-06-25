FROM oven/bun:1.3 AS build

WORKDIR /app

# 缓存依赖安装
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

ENV NODE_ENV=production

COPY ./src ./src
COPY ./config ./config
COPY ./tsconfig.json ./tsconfig.json
COPY ./.env ./.env
COPY ./drizzle.config.ts ./drizzle.config.ts

COPY ./entrypoint-api.sh ./entrypoint-api.sh
RUN chmod +x ./entrypoint-api.sh && ./entrypoint-api.sh


RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

FROM oven/bun:1.3

WORKDIR /app

COPY --from=build /app/server server
COPY ./package.json ./package.json
COPY ./config ./config
COPY ./views ./views
COPY ./public ./public
COPY ./uploads ./uploads
COPY ./.data ./.data
COPY ./.env ./.env
COPY ./dist/index.html ./dist/index.html

ENV NODE_ENV=production

EXPOSE 4080

CMD ["./server"]

