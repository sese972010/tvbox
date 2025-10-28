# TVBox 源聚合器 (Cloudflare Pages 终极版)

这是一个全自动的 TVBox 源聚合项目。它被设计为部署在 Cloudflare Pages 上，利用 Pages Functions 处理后端逻辑，实现前端、后端一体化，极大地简化了部署和维护流程。

## 功能

-   **自动搜索**: 每天自动通过 GitHub API 搜索最新的 TVBox 源文件。
-   **智能聚合**: 下载并合并所有搜索到的源，去除重复项，生成一个统一的订阅文件。
-   **稳定订阅地址**: 提供一个永久不变的订阅地址，TVBox 端无需频繁更换。
-   **简单部署**: 整个项目作为一个 Cloudflare Pages 应用一键部署，无需管理独立的服务器或 Worker。
-   **手动/自动更新**: 提供一个简单的网页界面，可以手动触发更新，同时也支持设置定时任务，实现全自动无人值守更新。

---

## 最终部署指南：从零到全自动

请严格按照以下步骤操作，即可成功部署。

### 第一步：准备工作 - 获取 GitHub 令牌

此令牌用于授权应用通过 GitHub API 搜索源文件。

1.  访问 [GitHub 个人访问令牌页面](https://github.com/settings/tokens/new)。
2.  **Note (描述)**: 填写一个易于识别的名称，例如 `TVBox-Project-Key`。
3.  **Expiration (有效期)**: 建议选择 `No expiration` (无过期)。
4.  **Scopes (权限)**: **只勾选** `public_repo` 这一个权限。
5.  点击 **Generate token**。
6.  **【重要】** 复制生成的令牌 (以 `ghp_` 开头) 并**安全保存**。此令牌只会显示一次。

### 第二步：核心操作 - 创建并配置 Cloudflare Pages 项目

这是唯一需要在 Cloudflare 上操作的步骤。

1.  **开始创建**:
    *   登录 Cloudflare -> 左侧菜单选择 **Workers & Pages**。
    *   点击 **Create application** -> **Pages** -> **Connect to Git**。

2.  **连接 GitHub 仓库**:
    *   选择您存放此项目的 GitHub 仓库，点击 **Begin setup**。

3.  **配置构建与部署 (请严格按照以下填写)**:
    *   **Project name**: 自定义，例如 `my-tvbox-aggregator`。
    *   **Production branch**: 选择 `main`。
    *   **Build settings**:
        *   **Framework preset**: 选择 `None`。
        *   **Build command**: **留空**。
        *   **Build output directory**: 填写 `frontend`。

4.  **添加环境变量**:
    *   在同一页面向下滚动，展开 **Environment variables (advanced)**。
    *   点击 **Add variable**。
        *   **Variable name**: `GH_TOKEN`
        *   **Value**: 粘贴您在【第一步】中保存的 GitHub 令牌。
        *   **【重要】** 点击 **Encrypt** 按钮加密。

5.  **首次部署**:
    *   点击 **Save and Deploy**，等待部署完成。

6.  **关联 KV 存储** (用于存放聚合结果):
    *   部署成功后，进入项目主页 -> **Settings** -> **Functions**。
    *   向下滚动到 **KV namespace bindings** -> 点击 **Add binding**。
        *   **Variable name**: `TVBox_KV`
        *   **KV namespace**: 点击下拉框 -> **Create a namespace** -> 输入名称 (例如 `TVBox_KV`) -> **Create**。
    *   **【重要】** 为了让绑定生效，需要**重新部署**。回到项目主页，在最新的部署记录上点击 **Retry deployment**。

### 第三步：运行与使用

1.  **访问应用**: 在 Pages 项目主页，点击您的项目 URL (例如 `https://my-tvbox-aggregator.pages.dev`)。
2.  **首次运行**: 在打开的页面上，点击 **开始聚合任务**。等待日志滚动，直至状态显示“任务成功完成！”。
3.  **获取订阅地址**: 任务成功后，您长期有效的订阅地址就是：
    *   `https://<您的项目URL>/subscribe.json`

### 第四步：(可选) 绑定个人域名

1.  在 Pages 项目设置中，进入 **Custom domains** 选项卡。
2.  按照 Cloudflare 的指引，添加您自己的域名，并配置 DNS 解析。
3.  成功后，您的订阅地址将变为 `https://<您的自定义域名>/subscribe.json`。

---
*此 README 是由 Jules (AI 软件工程师) 在最终确定项目架构后编写的。*
