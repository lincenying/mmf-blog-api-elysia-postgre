#!/usr/bin/env bash
# 一键构建并启动生产栈：先起 PostgreSQL，再显式跑迁移（幂等），最后启动 API/Web（API 入口仍会再跑一次迁移，同为幂等）
# 用法:
#   ./deploy-prod.sh              # 完整部署
#   ./deploy-prod.sh --api        # 仅构建 api_bun_postgre
#   ./deploy-prod.sh --api-only   # 同上
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.yml"
COMPOSE_FILES=(-f "$COMPOSE_FILE")
# Compose 插值（如 ${POSTGRES_DIR}）默认只读项目根 .env；显式加载 .env / .env.production 避免遗漏
ENV_FILES=(--env-file .env --env-file .env.production)

API_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --api|--api-only|-a)
      API_ONLY=1
      ;;
    -h|--help)
      echo "用法: $0 [--api|--api-only|-a]"
      echo "  （无参数）     启动 PostgreSQL、构建全部并 up -d"
      echo "  --api / -a     仅构建 docker-compose 中的 api_bun_postgre"
      exit 0
      ;;
    *)
      echo "未知参数: $arg（可用 --help 查看用法）" >&2
      exit 1
      ;;
  esac
done

if [[ "$API_ONLY" -eq 1 ]]; then
  echo ">>> 仅构建 api_bun_postgre"
  docker compose "${ENV_FILES[@]}" "${COMPOSE_FILES[@]}" build api_bun_postgre
  echo ""
  echo "已构建镜像: api_bun_postgre"
  echo "启动该服务: docker compose ${COMPOSE_FILES[*]} up -d api_bun_postgre"
  echo ""
  exit 0
fi

echo ">>> 启动 PostgreSQL"
docker compose "${ENV_FILES[@]}" "${COMPOSE_FILES[@]}" up -d db_postgres

PG_USER="postgres"
PG_DB="mmfblog_v2"
echo ">>> 等待 PostgreSQL 就绪 (${PG_USER} / ${PG_DB})"
pg_ok=0
for _ in $(seq 1 60); do
  if docker compose "${ENV_FILES[@]}" "${COMPOSE_FILES[@]}" exec -T db_postgres pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    pg_ok=1
    echo ">>> PostgreSQL 已就绪 (${PG_USER} / ${PG_DB})"
    break
  fi
  sleep 2
done
if [[ "$pg_ok" -ne 1 ]]; then
  echo "错误：PostgreSQL 未在约 2 分钟内就绪，请查看: docker compose ${COMPOSE_FILES[*]} logs db_postgres"
  exit 1
fi

echo ">>> docker compose ${COMPOSE_FILES[*]} build"
docker compose "${ENV_FILES[@]}" "${COMPOSE_FILES[@]}" build

echo ">>> docker compose ${COMPOSE_FILES[*]} up -d"
docker compose "${ENV_FILES[@]}" "${COMPOSE_FILES[@]}" up -d

WEB_PORT="4080"
echo ""
echo "已启动。前端: http://localhost:${WEB_PORT}"
echo "查看日志: docker compose ${COMPOSE_FILES[*]} logs -f api_bun_postgre"
echo "停止服务: docker compose ${COMPOSE_FILES[*]} down"
echo ""
