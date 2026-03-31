# GitHub Pages 配置指南

## 方式一：使用 GitHub Actions 自动部署（推荐）

### 步骤 1：启用 GitHub Pages

1. 访问你的仓库：https://github.com/Boxxelf/Calculus-Connections-Explorer-update
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**（页面）
4. 在 **Source**（源）部分：
   - 选择 **GitHub Actions** 作为源
5. 保存设置

### 步骤 2：推送工作流文件

由于需要 workflow 权限，你可以：

**选项 A：手动在 GitHub 上创建文件**
1. 在 GitHub 仓库中点击 **Add file** → **Create new file**
2. 文件路径输入：`.github/workflows/deploy.yml`
3. 复制以下内容：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

4. 点击 **Commit new file**

**选项 B：更新 Personal Access Token 权限**
- 在 GitHub Settings → Developer settings → Personal access tokens
- 创建新 token 或更新现有 token，确保包含 `workflow` 权限
- 然后重新推送

### 步骤 3：等待部署完成

1. 点击仓库的 **Actions** 标签
2. 等待工作流运行完成（通常需要 1-2 分钟）
3. 部署完成后，你的网站将在以下地址可用：
   - `https://boxxelf.github.io/Calculus-Connections-Explorer-update/`

---

## 方式二：直接使用 GitHub Pages（更简单）

### 步骤：

1. 访问你的仓库：https://github.com/Boxxelf/Calculus-Connections-Explorer-update
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**（页面）
4. 在 **Source**（源）部分：
   - 选择 **Deploy from a branch**
   - Branch: 选择 `main`
   - Folder: 选择 `/ (root)`
5. 点击 **Save**（保存）

### 访问链接

部署完成后（通常需要 1-2 分钟），你的网站将在以下地址可用：
- `https://boxxelf.github.io/Calculus-Connections-Explorer-update/`

---

## 验证部署

1. 等待几分钟让 GitHub 完成部署
2. 访问你的公共链接
3. 如果看到 "404" 或 "Not Found"，请等待更长时间（最多 10 分钟）
4. 如果仍然无法访问，检查：
   - 仓库是否为 **Public**（公开）
   - GitHub Pages 设置是否正确
   - 是否有构建错误（在 Actions 标签中查看）

---

## 更新网站

每次你推送代码到 `main` 分支时：
- **方式一**：GitHub Actions 会自动重新部署
- **方式二**：GitHub Pages 会自动更新（可能需要几分钟）

---

## 当前状态

- ✅ 代码已推送到 GitHub
- ⏳ GitHub Pages 需要手动配置（见上方步骤）
- 📝 工作流文件已创建（需要手动添加到 GitHub 或更新 token 权限）
