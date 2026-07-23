# mmf-blog-api-elysia-postgre

基于 [Bun](https://bun.sh) 与 [Elysia.js](https://elysiajs.com) 的博客 API 服务，为 MMF Blog 提供前后台 REST、WebSocket、文件上传与模板渲染能力。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 运行时 | Bun |
| Web 框架 | Elysia.js |
| 数据库 | BunSQLite（开发）/ PostgreSQL（生产） |
| ORM | Drizzle ORM |
| 身份验证 | JWT + HttpOnly Cookie |
| 配置 | Convict（YAML + 环境变量） |
| 模板 | Twig |
| 部署 | Docker / docker-compose |

## 功能概览

- **前台 API**（`/api/frontend`）：文章、评论、点赞、用户注册与登录
- **后台 API**（`/api/backend`）：分类、文章、用户、管理员登录（Cookie 会话）
- **管理员初始化**（`/backend`）：Twig 页面首次创建管理员
- **上传**（`/api/upload`）、**代理**（`/api/proxy`）、**JWT 示例**（`/api/jwt`）
- **WebSocket**（`/chat`）：聊天室
- **开发环境 Swagger**：`http://localhost:4000/docs`（仅 `NODE_ENV=development`）

## 环境要求

- [Bun](https://bun.sh) ≥ 1.3（与 `package.json` 中 `bun-types` 对齐）
- **SQLite**（开发默认，无需额外安装）
- **PostgreSQL**（生产环境 / 开发切换 `DB_PROVIDER=postgresql` 时）

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 生成本地密钥

```bash
bun run init:config
```

会在 `src/config/` 下生成（已加入 `.gitignore`，勿提交仓库）：

- `_secret.js` — JWT 签名密钥

### 3. 配置环境

```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
# 然后修改 .env.development 和 .env.production 的`POSTGRES_PASSWORD`
# 或者修改 config/development.yaml 和 config/production.yaml 的`postgre_password`也可以
```

按需修改数据库、CORS、端口等。应用同时会加载 `config/development.yaml`（或 `config/production.yaml`），**环境变量优先级高于 YAML**。

常用变量：

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `NODE_ENV` | `development` / `production` | `development` |
| `PORT` | 监听端口 | 开发 `4000`，生产配置 `4080` |
| `DB_PROVIDER` | `sqlite` / `postgresql`（可选） | 开发 `sqlite`，生产 `postgresql` |
| `SQLITE_DB_URL` | SQLite 文件路径 | `./.data/db.sqlite3` |
| `POSTGRES_*` | PostgreSQL 连接参数 | 见 example 文件 |
| `CORS_ORIGIN` | 允许的前端源，逗号分隔 | 见 example 文件 |
| `JWT_EXPIRES_IN_SECONDS` | Cookie / JWT 有效期（秒） | `2592000` |

### 4. 初始化数据库并启动

```bash
# 开发环境（SQLite）
bun run db:sqlite:migrate
bun dev
```

生产或开发使用 PostgreSQL 时：

```bash
bun run db:postgre:migrate
DB_PROVIDER=postgresql bun dev
```

- 服务：`http://localhost:4000`
- API 文档：`http://localhost:4000/docs`

### 5. 初始化管理员

浏览器打开 [http://localhost:4000/backend](http://localhost:4000/backend)，填写表单创建首个管理员。

成功后项目根目录会生成 `admin.lock` 防止重复创建；如需再次添加，**删除该文件**后刷新页面。

后台登录接口：`POST /api/backend/admin/login`（会话写入 HttpOnly Cookie）。

## 常用脚本

```bash
# 开发（热重载）
bun dev

# 类型检查 / Lint
bun run lint:ts
bun run lint
bun run lint:fix

# 构建
bun run build                # → ./dist/index.js
NODE_ENV=production bun run start

# 编译为单文件可执行（按平台）
bun run build:compile:mac    # → ./server-mac
bun run build:compile:linux  # → ./server-linux
bun run build:compile:win    # → ./server-win.exe

# 运行
NODE_ENV=production POSTGRES_PASSWORD=密码 POSTGRES_HOST=127.0.0.1 ./server-mac

# Drizzle 迁移
bun run db:sqlite:generate
bun run db:sqlite:migrate
bun run db:postgre:generate
bun run db:postgre:migrate
```

## API 路由前缀

| 前缀 | 说明 |
| --- | --- |
| `/api/frontend` | 前台博客接口 |
| `/api/backend` | 后台管理接口（部分路由需管理员 Cookie） |
| `/backend` | 管理员初始化 Twig 页面 |
| `/api/upload` | 文件上传 |
| `/api/jwt` | JWT 示例 |
| `/api/proxy` | 代理转发 |
| `/chat` | WebSocket 聊天 |
| `/public` | 静态资源（见 `config/*.yaml` 中 `static.prefix`） |
| `/docs` | Swagger（仅开发环境） |

## 统一响应格式

```ts
interface IApiResponse<T = unknown> {
    code: number // 200 成功，401 未授权，500 服务器错误等
    message: string
    data: T | null
}
```

身份验证：登录成功后由后端写入 HttpOnly Cookie，前端勿直接读写 Token；未授权返回 `401`。

## 项目结构

```text
├── src/
│   ├── app.ts              # 组装 Elysia 应用与路由
│   ├── index.ts            # 启动入口
│   ├── config/             # Convict 配置与密钥
│   ├── db/                 # Drizzle 连接与 schema
│   ├── modules/            # 业务模块（controller / service）
│   ├── plugins/            # CORS、鉴权、Swagger、响应包装等
│   ├── schema/             # Elysia 请求校验 Schema
│   ├── types/              # 共享类型
│   └── utils/
├── config/                 # development.yaml / production.yaml
├── views/                  # Twig 模板
├── public/                 # 静态资源
├── drizzle-postgre/        # PostgreSQL 迁移
├── drizzle-sqlite/         # SQLite 迁移
├── build/                  # 构建脚本
├── Dockerfile
├── docker-compose.yml
└── deploy-prod.sh          # 生产 compose 一键部署
```

## Docker

### 仅 API 镜像

```bash
docker build -t lincenying/bun-api-server-postgre:latest -f ./Dockerfile .
docker run -d \
  -p 4080:4080 \
  --env-file .env \
  --env-file .env.production \
  --name container-bun-api-server-postgre \
  lincenying/bun-api-server-postgre:latest
```

镜像内默认 `NODE_ENV=production`，监听 **4080**（见 `config/production.yaml`）。生产环境需配置 PostgreSQL 连接参数。

### docker-compose（API + PostgreSQL）

1. 准备 `.env`（可参考 `.env.development.example`，生产勿提交密钥），设置 `DB_PROVIDER=postgresql` 及 `POSTGRES_*`。

2. 一键构建并启动（会先等待 PostgreSQL，再执行 Drizzle 迁移）：

```bash
chmod +x ./deploy-prod.sh && ./deploy-prod.sh
```

访问：`http://localhost:4080`

常用命令：

```bash
docker compose logs -f api_bun_postgre
docker compose down
```

### 镜像拉取较慢（国内）

若 `docker.io` 拉取失败，可先拉取华为云镜像并打 tag（版本号以 `docker-compose.yml` / `Dockerfile` 为准）：

```bash
docker pull swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/oven/bun:1.3.14
docker tag swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/oven/bun:1.3.14 oven/bun:1.3
docker rmi swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/oven/bun:1.3.14

docker pull swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/postgres:18.4-alpine3.23
docker tag swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/postgres:18.4-alpine3.23 postgres:18.4-alpine
docker rmi swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/postgres:18.4-alpine3.23
```

## 开发说明

- 分层：`Controller → Service → DB`，业务逻辑勿写在 `index.ts` / `app.ts`。
- 数据库写操作统一走 Drizzle ORM，禁止手写原生 SQL。
- 修改 `views/*.twig` 时开发模式会触发 Bun 监听重启（见 `src/index.ts`）。
- 敏感文件：`.env*`、`_secret.js`、`_qiniu.js`、`admin.lock` 均已忽略，请勿提交。

## License

MIT
