# TVBox 源聚合器 - 权威手动部署指南 (静态文件版)

本项目旨在创建一个全自动的TVBox源聚合服务。它能自动从GitHub搜索最新的TVBox源，进行测试、去重和合并，最终将聚合结果写入到一个**静态的 `subscribe.json` 文件**中，为您提供一个永久、稳定、可缓存的订阅链接。

## 功能特性

- **全自动聚合**: 自动发现并整合最新的TVBox源。
- **静态订阅文件**: 聚合结果生成为 `subscribe.json` 静态文件，访问速度快，稳定性高，可被CDN缓存。
- **Cloudflare 驱动**: 完全基于Cloudflare的免费服务（Workers, Pages），无服务器成本。
- **手动部署**: 提供100%可靠的手动部署流程，让您完全掌控您的项目。
- **定时自动更新**: 可通过Cloudflare Cron Triggers配置，实现订阅文件的定期自动更新。

## 最终部署流程概览

本指南将引导您完成一个100%可靠的手动部署流程。整个过程分为四大步骤：

1.  **【步骤一：Cloudflare 核心配置】**: 我们将配置好后端Worker与前端Pages项目的“集成”，这是新方案能工作的绝对前提。
2.  **【步骤二：准备本地部署环境】**: 我们将准备好您的本地电脑，以便能够执行部署命令。
3.  **【步骤三：部署后端 Worker】**: 您将通过Cloudflare网页界面，将我们最终的、功能完整的后端代码，手动粘贴并部署。这是最可靠的部署方式。
4.  **【步骤四：部署前端并最终验证】**: 您将把前端项目关联到您的GitHub仓库，由Cloudflare Pages自动完成部署，并进行最终的端到端功能验证。

---

## 步骤一：Cloudflare 核心配置

### 1.1 部署前端占位符

在配置集成之前，我们需要先让Cloudflare上存在一个Pages项目。

1.  登录到您的Cloudflare账户。
2.  进入 **`Workers 和 Pages`**，选择 **`创建应用程序`** -> **`Pages`** -> **`连接到 Git`**。
3.  选择您的GitHub账户，并选中 `tvbox-source-aggregator` 这个仓库。
4.  在“**设置构建和部署**”页面，您**不需要修改任何设置**。直接滚动到底部，点击 **`保存并部署`**。
5.  等待Cloudflare完成第一次部署。

### 1.2 集成Pages项目到Worker

这是授权后端修改前端文件的关键一步。

1.  在左侧菜单栏中，再次点击 **`Workers 和 Pages`**。
2.  在“概述”页面，找到并点击您的后端Worker：**`tvbox-source-aggregator-api`**。
3.  进入Worker的管理页面后，点击顶部的 **`设置 (Settings)`** 标签页。
4.  在“设置”页面，点击左侧的 **`集成 (Integrations)`** 子菜单。
5.  找到“**Cloudflare Pages**”选项，点击它右侧的 **`添加集成 (Add Integration)`** 按钮。
6.  在弹出的窗口中：
    *   **变量名称 (Variable Name)**: 请**精确地**输入 `PAGES_PROJECT`。
    *   **生产环境 (Production)**: 从下拉菜单中，选择您的前端Pages项目 **`tvbox-source-aggregator`**。
7.  点击 **`保存 (Save)`**。

### 1.3 配置环境变量

后端代码需要知道您的Pages项目的名称。

1.  停留在Worker的“**设置 (Settings)**”页面，点击左侧的 **`变量 (Variables)`** 子菜单。
2.  在“**环境变量 (Environment Variables)**”部分，点击 **`添加变量 (Add variable)`**。
3.  填写以下内容：
    *   **变量名称 (Variable Name)**: `PAGES_PROJECT_NAME`
    *   **值 (Value)**: `tvbox-source-aggregator` (或者您在Cloudflare Pages中为项目设置的名称)
4.  再次点击 **`添加变量 (Add variable)`**，添加GitHub令牌：
    *   **变量名称 (Variable Name)**: `GH_TOKEN`
    *   **值 (Value)**: (粘贴您自己的**GitHub个人访问令牌 (PAT)**)
    *   **重要**: 点击“**加密 (Encrypt)**”按钮，保护您的令牌。
5.  点击 **`保存并部署 (Save and Deploy)`**。

---

## 步骤二：部署后端 Worker

我们将通过Cloudflare网页界面，手动粘贴最终的代码。

1.  回到您的后端Worker **`tvbox-source-aggregator-api`** 的管理页面。
2.  点击蓝色的 **`快速编辑 (Quick Edit)`** 按钮。
3.  **将编辑器中的所有旧代码，完全删除**。
4.  将您项目仓库中，`backend/src/index.js` 文件内的**所有代码**，完整地复制并粘贴到这个编辑器中。
5.  点击编辑器右下角的 **`保存并部署 (Save and Deploy)`** 按钮，并在确认窗口中再次点击。

---

## 步骤三：部署/更新前端

由于我们向 `frontend/public` 目录中添加了 `subscribe.json` 文件，并修改了 `frontend/script.js`，我们需要将这些最新的更改部署到Cloudflare Pages。

1.  请确保您本地的所有代码（特别是`frontend`目录下的文件）都已推送到您GitHub仓库的 `main` 分支。
2.  Cloudflare Pages会自动检测到新的推送，并开始一次新的部署。您可以在Pages项目的仪表板上看到部署的状态。

---

## 步骤四：最终验证

1.  **运行聚合任务**:
    *   等待前端新版本部署成功后，打开您的前端网站 `https://tvbox.pimm520.qzz.io`。
    *   **按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac) 进行强制刷新**。
    *   点击 **`开始聚合`** 按钮，并等待任务成功完成。您应该能看到“**静态文件写入成功！**”的日志。

2.  **验证订阅链接**:
    *   在任务成功后，**直接点击或在新标签页中打开**页面上显示的、指向 `.../subscribe.json` 的新链接。
    *   **请注意**: 静态文件更新在全球CDN同步可能需要**1到2分钟**。如果您第一次打开看到的是旧的占位符内容，请稍等片刻，然后**再次强制刷新** `.json` 文件的页面。

如果您成功看到了聚合后的JSON内容，那么恭喜您！您的项目已经以最稳妥的方式，成功部署并可以长期稳定使用了。
