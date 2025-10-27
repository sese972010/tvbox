# TVBox 源聚合器 - 最终版部署指南 (Pages Functions)

本项目旨在创建一个全自动的TVBox源聚合服务。它完全基于Cloudflare Pages及其内置的Functions功能，无需独立的Worker项目，部署和配置都极其简单。

## 工作原理

1.  **前端**: 一个位于 `frontend/` 目录的静态网页，为您提供一个控制面板。
2.  **后端 (`_worker.js`)**: 一个位于 `frontend/` 目录下的 `_worker.js` 文件。Cloudflare会自动将此文件部署为一个与您的静态网站相关联的Worker。它负责：
    *   提供API接口（例如 `/api/start-task`）来启动聚合任务。
    *   执行聚合逻辑（搜索、下载、合并）。
    *   将最终的聚合结果存入Cloudflare KV数据库。
    *   拦截对 `/subscribe.json` 的访问请求，并从KV中返回最新的聚合结果。

## 最终部署流程 (唯一正确的方法)

请忘记之前所有的复杂步骤。让您的项目成功运行，只需要以下两个核心步骤。

---

### 步骤一：将您的GitHub仓库连接到Cloudflare Pages

如果您已经做过这一步，请确保配置无误；如果没做过，请按以下步骤操作：

1.  登录到您的Cloudflare账户。
2.  进入 **`Workers 和 Pages`**，选择 **`创建应用程序`** -> **`Pages`** -> **`连接到 Git`**。
3.  选择您的GitHub账户，并选中 `tvbox-source-aggregator` 这个仓库。
4.  在“**设置构建和部署**”页面：
    *   **生产分支**: 确保选择了 `main`。
    *   **框架预设**: Cloudflare应该会自动识别为 `None`。
    *   **根目录**: **非常重要**，请确保这里填写的是 `frontend`。
5.  点击 **`保存并部署`**。Cloudflare将开始部署您的前端网站和 `_worker.js` 后端。

---

### 步骤二：配置您的Pages项目

在项目首次部署成功后，我们需要为后端功能提供必要的配置。

1.  在Cloudflare中，进入您刚刚部署的 **`tvbox-source-aggregator`** Pages项目。
2.  点击顶部的 **`设置 (Settings)`** 标签页。
3.  在左侧菜单中，点击 **`函数 (Functions)`**。
4.  向下滚动到“**KV 命名空间绑定 (KV namespace bindings)**”部分，点击 **`添加绑定 (Add binding)`**。
    *   **变量名称 (Variable Name)**: 请**精确地**输入 `TVBOX_KV`。
    *   **KV 命名空间 (KV namespace)**: 从下拉菜单中，选择您之前创建的 `TVBOX_KV`。
5.  点击 **`保存 (Save)`**。
6.  现在，在左侧菜单中，点击 **`环境变量 (Environment variables)`**。
7.  在“**生产环境 (Production)**”下，点击 **`添加变量 (Add variable)`**。
    *   **变量名称 (Variable Name)**: `GH_TOKEN`
    *   **值 (Value)**: (粘贴您自己的**GitHub个人访问令牌 (PAT)**)
    *   **重要**: 点击“**加密 (Encrypt)**”按钮，保护您的令牌。
8.  点击 **`保存 (Save)`**。

---

### 最终验证

1.  回到您Pages项目的概览页面，**触发一次新的部署**，以确保所有绑定和变量都已生效。
2.  部署成功后，打开您的前端网站 `https://tvbox.pimm520.qzz.io`。
3.  按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac) **强制刷新**。
4.  点击“**开始聚合**”按钮，等待任务完成。
5.  点击页面上生成的 `.../subscribe.json` 链接。

这一次，您应该能看到一个功能完全正常的、能成功返回聚合JSON的订阅链接。
