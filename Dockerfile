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

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile migrate \
	src/db/utils/migrate.ts

FROM debian:bookworm-20260623-slim

WORKDIR /app

# 使用阿里云 Debian 镜像，避免构建时访问 deb.debian.org 失败
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/server server
COPY --from=build /app/migrate migrate
COPY ./drizzle-postgre ./drizzle-postgre
COPY ./config ./config
COPY ./views ./views
COPY ./public ./public
COPY ./dist/index.html ./dist/index.html

RUN mkdir -p uploads .data

ENV NODE_ENV=production

COPY ./entrypoint-api.sh ./entrypoint-api.sh
RUN chmod +x ./entrypoint-api.sh ./server ./migrate

EXPOSE 4080

CMD ["./entrypoint-api.sh"]
