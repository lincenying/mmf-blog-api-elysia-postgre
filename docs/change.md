# 变更记录

## 2026-08-03 17:46:36

- **迁移**：恢复 `has-postgres-schema-tables.ts`；`db:postgre:migrate` 在核心表已存在时跳过基线迁移，避免 `CREATE TABLE` 冲突。
- **说明**：不再手写补建 `genealogy`（已纳入基线 `0000`）。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 恢复 PostgreSQL 已有表时跳过基线迁移
```

---

## 2026-08-03 17:42:33

- **迁移脚本**：配合重新生成的基线 `0000` 迁移，精简 `db:sqlite:migrate` / `db:postgre:migrate` / `db:postgre:migrate-genealogy`。
- **清理**：移除已有表跳过逻辑与手写 `CREATE TABLE genealogy`；删除 `has-postgres-schema-tables.ts`。
- **族谱迁数**：`migrate-genealogy-to-pg` 改为 Drizzle upsert，需先执行结构迁移。
- **脚本顺序**：`package.json` 中 sqlite 脚本置于 postgre 之前。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 精简数据库迁移脚本适配基线 0000
```

---


## 2026-08-03 17:31:36

- **数据库**：同步精简后的 `archive` 表结构，仅保留 `c_id/c_title/c_intro/c_content/c_view/c_posttime`。
- **代码**：更新 Drizzle schema、Elysia 校验、Service 增删改查，移除无效字段；新增迁移 `0003_archive_slim`。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 同步精简 archive 表字段
```

---

## 2026-08-03 17:20:44

- **数据库**：新增 `archive` 表 Drizzle schema（SQLite / PostgreSQL）及迁移 `0002_archive`。
- **接口**：`/api/archive` 增删改查（列表分页/详情公开，写入需管理员鉴权）。
- **校验**：补充 `archive.page` / `archive.insert` / `archive.modify` / `archive.id` Elysia Schema。

---

**本次改动建议的 commit message（未自动提交）：**

```
feat: 新增 archive 归档内容增删改查接口
```

---

## 2026-07-31 15:28:42

- **部署**：`deploy-prod.sh` 新增 `--api` / `--api-only` / `-a` 参数，可仅构建 `api_bun_postgre`，跳过 PostgreSQL 启动与完整 up。
- **帮助**：支持 `-h` / `--help` 查看用法。

---

**本次改动建议的 commit message（未自动提交）：**

```
feat: deploy-prod 支持仅构建 api_bun_postgre
```

---

## 2026-07-31 11:51:24

- **样式**：美化 `/backend` 添加管理员页（`views/index.twig` + `public/css/index.css`）。
- **设计**：Space Grotesk / DM Sans、冷灰蓝氛围背景、品牌英雄区、极简表单与单一 CTA。
- **体验**：语义化 label、邮箱/密码类型、成功/失败反馈、焦点环、`prefers-reduced-motion`、移动端适配。

---

**本次改动建议的 commit message（未自动提交）：**

```
style: 美化添加管理员页视觉与表单体验
```

---

## 2026-07-30 17:07:42

- **测试**：写操作用例补充数据库落库断言（`test/helpers/db.ts` 查询辅助）。
- **前台**：注册/改邮箱密码、发评、删评恢复（`comment_count`）、点赞/取消（`articles.like` + `likes` 表）、重置点赞数。
- **后台**：文章增改删恢复（含分类 `cate_num`）、分类/管理员/用户增改删恢复与密码哈希。
- **家谱**：新增/修改字段落库、删除叶子节点后行消失、有子辈删除失败时行仍在。

---

**本次改动建议的 commit message（未自动提交）：**

```
test: 写操作补充数据库落库断言
```

---

## 2026-07-30 16:52:18

- **测试**：新增全量 REST API 接口集成测试（`bun:test` + `app.handle` + 独立 SQLite）。
- **覆盖**：`/api/frontend`、`/api/backend`、`/api/genealogy`（含鉴权 403 / 登录失败）；排除上传、WebSocket、代理、HTML/JWT 演示路由。
- **基建**：`bunfig.toml` preload、`test/helpers`（app/request/auth/seed）、`package.json` 的 `test` / `test:watch`（串行 `--max-concurrency 1`）。

---

**本次改动建议的 commit message（未自动提交）：**

```
test: 新增前台/后台 API 接口集成测试
```

---

## 2026-07-30 14:39:25

- **功能**：合并 genealogy 族谱模块到本项目。
- **数据库**：新增 sqlite/postgre 双份 `genealogy` 表 schema 与迁移；SQLite 沿用已有 1814 条数据；PostgreSQL 建空表，并提供 `db:postgre:migrate-genealogy` 迁数脚本。
- **API**：`/api/genealogy` 列表公开；login/logout 复用 `admins`；增删改需管理员 Cookie 鉴权。
- **页面**：公开路由 `GET /genealogy`（Twig + D3），管理前弹出登录框。
- **修复**：`createAdminAuthGuard` / `createUserAuthGuard` 补充 `.as('scoped')`，使守卫对后续业务路由生效。

---

**本次改动建议的 commit message（未自动提交）：**

```
feat: 合并族谱模块（公开浏览、管理员增删改）
```

---

## 2026-07-28 14:30:19

- **修复**：删除 `categories` 表不存在的 `update_date` 字段（schema / 类型 / 服务层写入 / 迁移 SQL），与实际数据库结构对齐。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 移除 categories 表中不存在的 update_date 字段
```

---

## 2026-07-27 23:48:00

- **修复**：`createPublicApiLayer` / `createCookieSessionApiLayer` 补充 `.as('scoped')`，将 `responseWrapper` 的 `onAfterHandle` / `onError` 逐级上浮到业务路由。
- **现象**：`/api/frontend/trending` 等接口直接返回 Service 原始数据，未包裹 `code` / `message` / `data`。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 修复 API 响应包装中间件因 scoped 嵌套过深未生效
```

---

## 2026-07-26 08:32:00

- **部署**：`deploy-prod.sh` 为所有 `docker compose` 命令显式传入 `--env-file .env --env-file .env.production`，确保 `docker-compose.yml` 中 `${POSTGRES_DIR}`、`${POSTGRES_PASSWORD}` 等插值能读取到环境文件。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: deploy-prod 显式加载 env 文件供 compose 插值
```

---

## 2026-07-26 08:26:00

- **修复**：`docker-compose.yml` 中 `POSTGRES_PASSWORD` 变量替换语法由 `${POSTGRES_PASSWORD:postgres}` 改为 `${POSTGRES_PASSWORD:-postgres}`，未设置或为空时默认 `postgres`；`POSTGRES_DIR` 保持 `${POSTGRES_DIR:-/var/lib/postgresql}` 写法不变。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 修正 docker-compose 中 POSTGRES_PASSWORD 默认值语法
```

---

## 2026-07-23 14:33:28

- **修复**：关闭 `build/*.ts` 中 `minify.identifiers`，避免 Elysia 依赖的 `constructor.name`（如 `ElysiaFile`）被混淆。
- **现象**：生产编译包（`server-mac` / `dist/index.js`）访问 `/favicon.ico`、`/robots.txt`、`/*` 时返回 `[object Object]`，`Content-Type` 为 `application/octet-stream`，浏览器触发下载。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 关闭构建标识符混淆以修复静态文件被下载
```

---

## 2026-06-26 10:30:00

- **Schema**：点赞表 `article_likes` 重命名为 `likes`（SQLite / PostgreSQL 双端同步）。
- **Schema**：`likes` 表新增 `_id`（主键）、`creat_date`、`timestamp` 字段，与其他业务表字段风格一致。
- **Schema**：主键由 `(article_id, user_id)` 复合主键改为 `_id`，并保留 `(article_id, user_id)` 唯一约束以防重复点赞。
- **业务**：`FrontendLikeService.like` 插入点赞记录时补充 `_id`、`creat_date`、`timestamp`。
- **迁移**：新增 PostgreSQL 迁移 `drizzle-postgre/0002_big_thaddeus_ross.sql`（创建 `likes` 表并删除 `article_likes`）。
- **工具**：`has-postgres-schema-tables.ts` 核心表检测由 `article_likes` 更新为 `likes`。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 点赞表重命名为 likes 并补充标准字段
```

---

## 2026-06-26 09:24:09

- **修复**：Dockerfile 运行阶段将 Debian apt 源替换为阿里云镜像，解决国内构建时 `502 Bad Gateway` 导致 `apt-get` 失败。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: Docker 构建使用阿里云 Debian 镜像源
```

---

## 2026-06-26 09:22:07

- **修复**：Dockerfile 运行阶段改为从构建上下文复制 `drizzle-postgre`，修复构建阶段未包含该目录导致的 COPY 失败。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 修复 Docker 构建时 drizzle-postgre 目录缺失
```

---

## 2026-06-26 09:06:14

- **优化**：Dockerfile 构建阶段额外 compile `migrate` 二进制，运行阶段移除 `node_modules`、`src`、`package.json`、`tsconfig.json` 及 Bun 运行时。
- **优化**：运行镜像改用 `debian:bookworm-slim`，仅保留 `server`、`migrate`、`drizzle-postgre` 与业务所需静态资源。
- **优化**：`entrypoint-api.sh` 改为直接执行 `./migrate` 与 `./server`，不再依赖 `bun run`。
- **优化**：`docker-compose.yml` 为 `uploads`、`.data` 增加 volume 挂载，避免打入镜像。

---

**本次改动建议的 commit message（未自动提交）：**

```
perf: 编译 migrate 二进制并精简 Docker 运行镜像
```

---

## 2026-06-25 16:30:00

- **修复**：PostgreSQL 迁移前检测核心业务表是否已存在，已存在则跳过迁移，避免 `relation already exists` 导致启动失败。
- **修复**：Dockerfile 移除构建阶段执行 `entrypoint-api.sh`，迁移改回容器启动时执行。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 库表已存在时跳过 PostgreSQL 迁移
```

---

## 2026-06-25 16:00:00

- **修复**：`docker-compose.yml` 显式设置 `NODE_ENV=production`，避免 `.env` 中 `NODE_ENV=development` 覆盖镜像生产环境配置。
- **修复**：`entrypoint-api.sh` 启动前 `export NODE_ENV=production`，确保迁移脚本加载 `production.yaml`。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: Docker 容器迁移与启动时强制使用生产环境配置
```

---

## 2026-06-25 14:00:00

- **fix**：前台文章列表接口不再返回 `html` 字段，查询时显式排除该列以减少数据传输。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 前台文章列表接口不返回 html 字段
```

---

## 2026-06-25 12:30:00

- **清理**：移除 MongoDB / Mongoose 全部代码与依赖（`mongoose.ts`、`schema/mongoose/`、`migrate-from-mongo.ts`）。
- **配置**：删除 `mongo_uri`、`mongo_db`、`DATABASE_URL`、`MONGO_DB` 配置项及 `db:migrate-from-mongo` 脚本。
- **Docker**：`docker-compose.yml` 移除 `api_mongo` 服务及相关环境变量。
- **文档**：更新 `README.md`、`.env.development.example`、`.cursor/rules/global-01-elysia.mdc`。

---

**本次改动建议的 commit message（未自动提交）：**

```
chore: 清理 MongoDB/Mongoose 相关代码与依赖
```

---

## 2026-06-25 12:00:00

- **重构**：博客主数据从 MongoDB/Mongoose 迁移至 Drizzle ORM，支持 SQLite（开发默认）与 PostgreSQL（生产默认）。
- **配置**：新增 `DB_PROVIDER` 环境变量（`sqlite` | `postgresql`），开发环境可显式切换为 PostgreSQL。
- **Schema**：新增 `articles`、`categories`、`comments`、`users`、`admins`、`article_likes` 表（SQLite / PostgreSQL 双端定义）；点赞从 MongoDB 数组改为 `article_likes` 关联表。
- **Service**：7 个业务 Service 全部改为 Drizzle 实现，通过 `~/db` 统一出口按环境选库。
- **迁移**：新增 `bun run db:migrate-from-mongo` 从 MongoDB 导入历史数据；`db:sqlite:migrate` 改为执行 `src/db/migrate-sqlite.ts`。
- **清理**：移除 `/api/bun-sqlite` 示例路由（与主业务 Schema 冲突）；Mongoose 仅保留于迁移脚本。

---

**本次改动建议的 commit message（未自动提交）：**

```
feat: 将博客主数据从 MongoDB 迁移至 Drizzle SQLite/PostgreSQL
```

---


- **修复**：`ensure-postgres-db.ts` 建库改用 `TEMPLATE template0`，避免 `template1` 被占用时报错 `55006`。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: PostgreSQL 建库改用 template0 避免会话冲突
```

---

## 2026-06-19 22:40:00

- **修复**：迁移前通过 `ensure-postgres-db.ts` 自动创建缺失的 PostgreSQL 数据库 `mmfblog_v2`。
- **修复**：`db:postgre:migrate` 改为执行 `src/db/migrate.ts`，统一建库与迁移并输出完整错误。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 迁移前自动创建缺失的 PostgreSQL 数据库
```

---

## 2026-06-19 22:35:00

- **修复**：PostgreSQL `users._id` 由 `.default(uuidv4())` 改为 `.$defaultFn(() => uuidv4())`，避免模块加载时固定 UUID 及 drizzle-kit 生成错误迁移。
- **修复**：删除错误的 `drizzle-postgre/0001_slim_night_thrasher.sql`（将 `_id` 设为静态默认值）。
- **修复**：`entrypoint-api.sh` 启动时仅执行 `db:postgre:migrate`，不再每次 `generate`。
- **修复**：`src/db/migrate.ts` 改用 `node-postgres` migrator 并输出完整错误信息。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 修复 PostgreSQL 迁移因静态 UUID 默认值失败的问题
```

---

## 2026-05-21 11:37:09

- **修复**：`backend-article` 的 `deletes` / `recover` / `modify` 先校验 `findOneAndUpdate` 结果，文章不存在时抛出校验错误，再按 `result.category` 更新分类 `cate_num`（不再误用文章 `_id` 更新分类）。
- **修复**：`recover` 将 `is_delete` 更正为 `0`（恢复未删除状态），并统一使用 `{ new: true }` 返回更新后文档。

---

**本次改动建议的 commit message（未自动提交）：**

```
fix: 文章删除/恢复/修改前先校验更新结果再改分类计数
```

---

## 2026-05-21 11:05:12

- **架构**：合并 `src/modules` 下 7 对 `*.model.ts` 与 `*.service.ts`，统一为 `Controller → Service → DB` 分层；删除冗余透传层。
- **修复**：`backend-category` 原 model 类名误写为 `BackendArticleModel`，合并后更正为 `BackendCategoryService`。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 合并 modules 中 model 与 service 层
```

---

## 2026-05-21 10:03:53

- **文档**：重写 `README.md`，对齐当前技术栈（Bun + Elysia + MongoDB/PostgreSQL/SQLite）、快速开始、`init:config`、路由前缀、环境变量、Docker/docker-compose 与 Mongoose 版本说明；修正 `admin.lock` 文件名与端口说明（开发 4000 / 生产 4000）。

---

**本次改动建议的 commit message（未自动提交）：**

```
docs: 重写 README 对齐项目结构与部署说明
```

---

## 2026-05-21 09:30:00

- **JWT 工具**：`utils/jwt-token.ts` 统一 `signSessionToken` / `verifySessionToken`；`check-jwt` 改为同步布尔校验。
- **会话 Cookie**：`utils/session-cookie.ts` 抽取登录/登出 Cookie 读写，前后台 Controller 去重。
- **错误码**：`types/api-code.ts` 定义 `API_CODE`；Mongoose/Postgre/SQLite 等将 `-200` 改为 `SERVER_ERROR(500)`，业务校验统一 `VALIDATION(201)`。
- **数据库**：Service 经 `~/db` 导入 `sqliteDb` / `postgreDb`；Mongo 连接改为 `config.db.mongo_uri` + `mongo_db`。
- **路由**：`admin` POST 使用 `user.insert` Schema；postgre 增加 `login`/`logout` 与 404；bun-sqlite 增加 404。
- **环境**：新增 `.env.development.example`；`.gitignore` 忽略 `.env*`（保留 example）。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 集中 JWT/会话工具、统一 API_CODE 并完善配置示例
```

---

## 2026-05-21 09:05:51

- **目录规范**：新增 `src/db/index.ts` 统一导出 Drizzle 实例（`sqliteDb` / `postgreDb`）。
- **配置**：`config/schema.ts` 增加 `jwt.expiresInSeconds`，登录 Cookie `maxAge` 与 `jwt.sign` 的 `expiresIn` 均从配置读取。
- **插件化**：
  - `src/plugins/api-stack.ts`（自 `utils/api-stack` 迁入）；
  - `src/plugins/auth.ts`：`createAdminAuthGuard` / `createUserAuthGuard`，消除 Controller 内重复的 `checkJWT`；
  - `plugins/index.ts` 统一导出 CORS、响应包装、鉴权、API 栈、访问日志。
- **响应格式**：`response-wrapper` 对齐 `IApiResponse`（`code` / `message` / `data`），错误时 `data: null`；`ApiResponse` 类型改为 `IApiResponse` 别名。
- **路由**：后台/前台 Controller 公开路由置于鉴权插件之前；上传/JWT 模块复用 `createPublicApiLayer` / `createCookieSessionApiLayer`。
- **Bun 兼容**：`node:fs` / `node:crypto` / `node:path` 改为 `fs` / `path` 与 `crypto.randomUUID()`。
- **类型**：修复 `response-wrapper`、`user.ts`、`article.types.ts`、`lru-cache.ts` 中的 `any`。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 按 global-01-elysia 规范补齐插件、鉴权与 IApiResponse
```

---

## 2026-05-20 18:45:00

- **Mongoose Schema 迁入**：原 `src/schema/mongoose-*.ts` 移至 `src/modules/mongoose/`，并重命名为 **`*.schema.ts`**（`article`、`category`、`comment`、`user`、`admin`、`template`）。
- **引用**：各 `*.model.ts` 改为从 `~/modules/mongoose/<name>.schema` 默认导入 Model。
- **保留**：`src/schema/` 仅保留 `elysia-schema*.ts`（路由校验）。
- **规范**：更新 `.cursor/rules/global-01-elysia.mdc` 目录说明（`modules/mongoose` 与 `src/schema` 职责划分）。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 将 Mongoose schema 集中到 modules/mongoose
```

---

## 2026-05-20 18:00:00

- **Mongoose Model 迁入模块**：原 `src/models/*.model.ts` 全部移至对应模块目录——`modules/backend/`（`backend-article`、`backend-category`、`backend-user`）、`modules/frontend/`（`frontend-article`、`frontend-user`、`frontend-comment`、`frontend-like`）。
- **引用**：各 `*.service.ts` 改为相对路径 `./xxx.model` 引入；已删除空置的 `src/models/`。
- **规范**：`.cursor/rules/global-01-elysia.mdc` 项目结构中补充 `module.model.ts` 说明（与 Drizzle `db/schema` 并存场景）。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 将 Mongoose model 迁入 modules 并与 Service 同目录
```

---

## 2026-05-20 17:15:00

- **Mongo / 业务 Service 层**：将原 `src/controllers/*` 全部迁入对应模块下的 `*.service.ts`（后台：`backend-article/category/user.service.ts`；前台：`frontend-article/user/comment/like.service.ts`；上传：`upload-image.service.ts`；后台 Twig：`admin-template.service.ts`）。
- **路由插件**：`backend.controller`、`frontend.controller`、`upload.controller`、`admin.controller` 仅依赖上述 Service；后台「前台用户」管理路由改用 `FrontendUserService`，不再直连 `FrontendUserModel`。
- **移除**：整个 `src/controllers/` 目录（已无引用）。
- **依赖**：`AdminTemplateService` 通过相对路径调用 `BackendUserService`，替代原先 `AdminTemplateController` → `BackendUserController`。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 移除 controllers 目录并将 Mongoose 业务收口至模块 Service
```

---

## 2026-05-20 16:30:00

- **Drizzle 表定义**：迁入 `src/db/schema/postgre/`（`users.ts` + `index.ts`）、`src/db/schema/sqlite/`（`articles.ts`、`genealogy.ts` + `index.ts`）；删除原 `src/schema/postgre-sql.ts`、`src/schema/bun-sqlite.ts`。`drizzle.config.ts` / `drizzle-sqlite.config.ts` 的 `schema` 指向上述目录入口；`src/db/postgre-sql.ts`、`src/db/bun-sqlite.ts` 改为从 `~/db/schema/*` 聚合导出加载 schema。
- **修正**：Postgre `users` 列定义变量由拼写错误的 `userScheam` 改为 `userSchema`（仅变量名，表结构不变）。
- **Service 层**：Postgre 用户逻辑迁至 `src/modules/postgre/postgre-user.service.ts`（`PostgreUserService`）；SQLite 文章逻辑迁至 `src/modules/bun-sqlite/sqlite-article.service.ts`（`SqliteArticleService`）。`postgre.controller.ts`、`bun-sqlite.controller.ts` 仅调用 Service，不再直连原 Model。
- **移除**：`src/models/postgre/frontend-user.model.ts`、`src/models/sqlite/article.model.ts` 及空目录。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 拆分 Drizzle schema 目录与 Postgre/SQLite Service 层
```

---

## 2026-05-20 15:45:00

- 修复 `docker-compose.yml` 中 `api_postgres.healthcheck.test`：改为多行列表 + 纯标量形式，满足 ESLint `yaml/plain-scalar` / `yaml/quotes`，行为仍为 `CMD-SHELL` 执行 `pg_isready`。

---

**本次改动建议的 commit message（未自动提交）：**

```
style: 调整 postgres healthcheck 写法以符合 YAML 规范
```

---

## 2026-05-20 14:30:00

- 按 `global-01-elysia.mdc` 的 `modules/` 约定：原 `src/routes/*.ts` 全部迁入 `src/modules/<领域>/<领域>.controller.ts`，并由 `src/modules/index.ts` 统一导出，供 `app.ts` 以插件方式 `.use()` 挂载。
- 新增 `src/plugins/api-stack.ts`：`createPublicApiLayer()`（CORS + validationSchema + responseWrapper）、`createCookieSessionApiLayer()`（在其上附加 `cookies` 守卫），消除前台/后台/WebSocket 重复的中间件链。
- 新增 `src/utils/elysia-request.ts`：`cookieValue` / `queryString`，消除嵌套 `guard` 下 Cookie / query 推断为 `unknown` 导致的类型错误。
- `src/plugins/index.ts` 额外导出上述 API 层工厂函数。
- 删除已空置的 `src/routes/` 目录。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 路由迁入 modules 并抽取 API 中间件栈
```

---

## 2026-05-20 12:00:00

- 按 `global-01-elysia.mdc` 约定拆分入口：新增 `src/app.ts` 导出 `createApp()`，集中挂载插件与路由；`src/index.ts` 仅负责上传目录初始化、开发环境 Twig 预热、`createApp()` 与 `listen`，符合「入口不写业务组装、插件化挂载」。
- 在 `src/types/global.types.ts` 补充规范约定的 `IApiResponse<T>`（`code` / `message` / `data`），与现有判别联合型 `ApiResponse` 并存，便于新业务渐进对齐。
- TypeScript：`createApp` 不显式标注返回类型，避免 Elysia 条件挂载 Swagger 导致的泛型不兼容。

---

**本次改动建议的 commit message（未自动提交）：**

```
refactor: 按 Elysia 规范拆分应用入口并补充 IApiResponse 类型
```
