# Growth CRM · 晓曼财经 SaaS 系统

面向中小企业销售团队的前端演示系统，覆盖客户、商机、任务、合同回款、经营分析、SCRM、学员管理和 AI 销售助手。

## 本地运行

环境要求：Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

浏览器访问终端显示的本地地址。项目使用 `HashRouter`，页面刷新不依赖服务器路由配置。

## 生产构建

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`。`vite.config.ts` 已配置 `base: './'`，可直接部署到静态站点。

## GitHub Pages

1. 将项目推送到 GitHub 仓库。
2. 在仓库 `Settings > Pages` 中将 Source 设为 `GitHub Actions`。
3. 推送到 `main` 分支后，`.github/workflows/deploy.yml` 会自动构建并发布。

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS
- React Router（HashRouter）
- Recharts
- Lucide React

所有业务数据均为确定性的本地模拟数据，不依赖后端服务。
