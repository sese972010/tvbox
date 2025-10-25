# TVBox 源聚合器

这是一个全自动的TVBox源查找、测试、合并和部署工具。它提供一个Web UI控制面板，让您可以轻松地聚合来自GitHub的最新、最快的TVBox源，并生成一个稳定、高质量的订阅地址。

整个项目完全基于 Cloudflare 和 GitHub 的免费服务，无需任何自己的服务器。

## 功能特性

- **图形化界面**: 通过简单的Web UI启动和监控聚合任务。
- **自动搜索**: 利用GitHub API自动搜索最新的TVBox源文件。
- **有效性验证**: 自动测试源地址的可用性，过滤无效链接。
- **去重合并**: 将多个源的站点、直播源和解析规则合并，并移除重复条目。
- **Serverless 部署**: 前端部署于Cloudflare Pages，后端API部署于Cloudflare Workers。
- **永久订阅链接**: 利用Cloudflare提供一个可绑定您自己域名的、永久有效的订阅地址。

## 部署指南

请按照以下步骤来部署您自己的TVBox源聚合器：

### 准备工作

1.  **一个 GitHub 账号**。
2.  **一个 Cloudflare 账号**。
3.  **安装 Node.js 和 npm**: 请从 [Node.js官网](https://nodejs.org/) 下载并安装LTS版本。

### 步骤 1: 获取项目代码

将本仓库克隆到您的本地机器：
```bash
git clone <仓库地址>
cd <项目目录>
```

### 步骤 2: 安装依赖

在项目根目录下运行以下命令，安装所有必需的开发工具（如Wrangler）：
```bash
npm install
```

### 步骤 3: 配置密钥

项目需要两个密钥才能工作。请在项目根目录创建一个名为 `.env` 的文件，并填入以下内容：

```env
# 1. Cloudflare API Token
# 前往 Cloudflare仪表板 -> 我的个人资料 -> API令牌 -> 创建令牌 -> 使用“编辑Cloudflare Workers”模板
CLOUDFLARE_API_TOKEN="粘贴你的Cloudflare_API_Token在这里"

# 2. GitHub Personal Access Token
# 前往 GitHub -> Settings -> Developer settings -> Personal access tokens -> Generate new token
# 勾选 `public_repo` 权限即可
GITHUB_TOKEN="粘贴你的GitHub_Token在这里"
```

### 步骤 4: 部署后端 API

运行以下命令来部署Cloudflare Worker：
```bash
npm run deploy-api
```
部署成功后，终端会输出一个类似 `https://tvbox-source-aggregator.your-worker-name.workers.dev` 的URL。**请复制这个URL**，下一步会用到。

### 步骤 5: 配置前端

打开 `frontend/script.js` 文件，找到顶部的 `API_BASE_URL` 常量，将其值替换为您上一步复制的Worker URL：

```javascript
// 将这里的URL替换成你自己的
const API_BASE_URL = 'https://tvbox-source-aggregator.your-worker-name.workers.dev';
```

### 步骤 6: 部署前端 UI

运行以下命令来部署UI界面到Cloudflare Pages：
```bash
npm run deploy-ui
```
部署成功后，终端会输出一个Pages的访问地址，例如 `https://tvbox-ui.pages.dev`。

### 步骤 7: 完成！

现在，您可以通过浏览器访问您的Pages地址来使用这个工具了！

- **输入关键字** (或留空使用默认)，点击 **“开始聚合”**。
- 在 **“实时日志”** 区域查看任务进度。
- 任务完成后，在 **“聚合订阅链接”** 区域会出现一个下载链接，点击即可获取合并后的 `tvbox_source.json` 文件。
