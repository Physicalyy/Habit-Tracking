# Habit-Tracking

Habit-Tracking 是一个习惯打卡系统，包含后端服务、Web 前端和微信小程序。项目使用 GitHub 做仓库管理，采用单仓库 monorepo 结构。

## 目录结构

```text
Habit-Tracking/
  apps/
    backend/          # 后端服务
    web/              # Web 前端
    miniprogram/      # 微信小程序
  packages/
    contracts/        # 接口契约、DTO、枚举、错误码
    shared/           # 跨端共享工具、常量、校验规则
  db/
    migrations/       # 数据库结构变更脚本
    seeds/            # 初始化数据脚本
    docs/             # 数据库设计说明
  docs/
    api/              # 接口文档
  scripts/            # 本地开发、构建、检查脚本
```

本仓库是公开主仓，产品规格、PRD、开发前规划、设计原型、视觉稿和参考素材不放在本仓库，统一放在独立文档仓库：

`git@github.com:Physicalyy/Habit-Tracking-docs.git`

## 子项目

- `apps/backend/`：后端服务，负责用户、习惯、打卡、统计等核心业务能力。
- `apps/web/`：Web 前端，面向后台管理或桌面端使用场景。
- `apps/miniprogram/`：微信小程序，面向移动端习惯打卡使用场景。

具体技术栈在各子项目初始化时确定，初始化前不在目录中混入框架模板文件。

## Docker Compose Deployment Test

The V1 deployment test runs the backend service with a MySQL container. The
WeChat miniprogram is not built into this compose stack.

1. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set `MYSQL_ROOT_PASSWORD` to the local deployment password.
   Do not commit `.env`.

3. Build and start the stack:

   ```bash
   docker compose up -d --build
   ```

4. Verify the backend health endpoint:

   ```bash
   curl http://localhost:18080/api/health
   ```

Compose services:

- `mysql`: MySQL 8.0, creates `${MYSQL_DATABASE}` on first startup, persisted in
  the `habit_mysql_data` Docker volume.
- `backend`: Spring Boot backend, connects to
  `jdbc:mysql://mysql:3306/${MYSQL_DATABASE}` inside the compose network.

If Docker Hub is slow or blocked, set `BACKEND_JRE_IMAGE` in `.env` to an
available Java 17 JRE image mirror before running `docker compose up`.

Default local ports:

- Backend: `localhost:18080`
- MySQL: `localhost:3306`

To reset all local database data for a clean deployment test:

```bash
docker compose down -v
```
