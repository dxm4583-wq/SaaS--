# 晓曼财经 SaaS 系统 GitHub 上传说明

## 可上传内容

当前项目已完成生产构建与权限测试，可以上传到 GitHub。桌面交付目录已排除以下无需提交的内容：

- `node_modules/`：本地依赖，可通过 `npm ci` 重新安装
- `dist/`：构建产物，由 GitHub Actions 自动生成
- `*.tsbuildinfo`：TypeScript 编译缓存

源码、配置、Mock 数据、测试脚本、项目截图和 GitHub Pages 工作流均已保留。

## 推荐上传方式

1. 在 GitHub 新建一个空仓库。
2. 使用 GitHub Desktop 选择桌面上的“晓曼财经”文件夹，或在该目录执行 Git 命令。
3. 将代码提交并推送到 `main` 分支。
4. 打开仓库的 `Settings > Pages`。
5. 在 `Build and deployment > Source` 中选择 `GitHub Actions`。
6. 等待 `Deploy to GitHub Pages` 工作流完成。

## 命令行上传

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

## 访问地址

部署成功后：

```text
https://你的用户名.github.io/你的仓库名/
```

项目使用 `HashRouter`，子页面地址形如：

```text
https://你的用户名.github.io/你的仓库名/#/ai
https://你的用户名.github.io/你的仓库名/#/ai-creative
https://你的用户名.github.io/你的仓库名/#/students/overview
https://你的用户名.github.io/你的仓库名/#/marketing/overview
```

## 本地验证

环境要求：Node.js 20 或更高版本。

```bash
npm ci
npm run build
npm run preview
```

本项目为纯前端演示系统，业务数据均为本地 Mock 数据，不包含后端服务。
