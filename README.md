# TVBox 源聚合器 - 权威手动部署与配置指南

本项目旨在创建一个全自动的TVBox源聚合服务。它能自动从GitHub搜索最新的TVBox源，进行测试、去重和合并，最终通过一个由Cloudflare Worker提供的、永久有效的订阅链接，为您的TVBox应用提供稳定、高质量的源。

## 功能特性

- **全自动聚合**: 无需人工干预，自动发现并整合最新的TVBox源。
- **永久订阅链接**: 一次配置，长期有效。后端通过Cloudflare KV存储，确保链接内容永久更新。
- **Cloudflare 驱动**: 完全基于Cloudflare的免费服务（Workers, Pages, KV），无服务器成本。
- **自定义域名**: 支持绑定您自己的域名，打造个性化的订阅服务。
- **定时自动更新**: 可通过Cloudflare Cron Triggers配置，实现订阅源的定期自动更新。

## 手动部署流程概览

由于自动化部署在不同环境下存在不确定性，本指南将引导您完成一个**100%可靠的手动部署流程**。整个过程分为五大步骤：

1.  **【步骤一：Cloudflare 核心配置】**: 这是最关键的一步。我们将配置好项目所需的基础服务，包括创建用于存储聚合结果的KV命名空间。
2.  **【步骤二：获取部署凭证】**: 我们将获取部署后端服务所需的“钥匙”，即您的Cloudflare账户ID和API令牌。
3.  **【步骤三：配置项目环境变量】**: 我们会将获取到的凭证，以及您的GitHub访问令牌，配置到项目本地的 `.env` 文件中，为部署做准备。
4.  **【步骤四：部署后端Worker】**: 您将在自己的电脑上，通过一条命令，将我们最终修复版的后端代码，精准地部署到Cloudflare。
5.  **【步骤五：部署前端并最终验证】**: 您将把前端项目关联到您的GitHub仓库，由Cloudflare Pages自动完成部署，并进行最终的端到端功能验证。

请严格按照以下步骤操作，这将确保您的项目能够成功、稳定地运行。

---

## 步骤一：Cloudflare 核心配置

在这一步，我们将在Cloudflare上创建项目所需的基础资源。

### 1.1 创建 KV 命名空间

KV 是一个键值存储数据库，我们将用它来永久保存最新聚合的TVBox源。

1.  登录到您的Cloudflare账户。
2.  在左侧菜单栏中，找到并点击 **`Workers 和 Pages`**。
3.  在打开的页面中，选择顶部的 **`KV`** 标签页。
4.  点击蓝色的 **`创建命名空间`** 按钮。
5.  在“**命名空间名称**”输入框中，**精确地**输入 `TVBOX_KV`。
6.  点击 **`添加`**。您的KV数据库现已创建完毕。

### 1.2 检查 SSL/TLS 加密模式

这个设置对于确保您的自定义域名能正常工作至关重要。

1.  返回到您的Cloudflare主页，并选择您的域名（例如 `qzz.io`）。
2.  在左侧菜单栏中，找到并点击 **`SSL/TLS`** 图标。
3.  确保您在顶部的“**概述 (Overview)**”子菜单中。
4.  检查加密模式。**必须**确保它被设置为“**完全 (Full)**”或“**完全（严格）(Full (Strict))**”。
5.  如果它当前是“灵活 (Flexible)”，请**务必**将它修改为“**完全 (Full)**”并保存。

---

## 步骤二：获取部署凭证

这些凭证是您授权本地电脑部署代码到Cloudflare的“钥匙”，请妥善保管。

### 2.1 获取 Cloudflare 账户 ID (Account ID)

1.  停留在您的Cloudflare主页仪表板上。
2.  在右侧边栏，找到并点击您的域名。
3.  在新页面的右下角，您会看到一个“**API**”部分。
4.  您的“**账户ID (Account ID)**”就在那里。它是一长串由数字和字母组成的字符串。
5.  请**复制**这个ID，并把它粘贴到一个临时的记事本里。

### 2.2 创建 Cloudflare API 令牌 (API Token)

1.  在Cloudflare仪表板的右上角，点击您的**个人资料图标**，然后选择“**我的个人资料 (My Profile)**”。
2.  在左侧菜单中，选择“**API令牌 (API Tokens)**”。
3.  点击蓝色的“**创建令牌 (Create Token)**”按钮。
4.  在“API令牌模板”页面，找到“**编辑Cloudflare Workers (Edit Cloudflare Workers)**”这个模板，并点击它旁边的“**使用模板 (Use template)**”按钮。
5.  **您不需要修改任何权限设置**，模板默认的权限已经足够了。
6.  直接滚动到页面底部，点击“**继续以显示摘要 (Continue to summary)**”。
7.  在摘要页面，再次点击“**创建令牌 (Create Token)**”。
8.  Cloudflare现在会生成您的API令牌。**这是您唯一一次能看到它的机会。**
9.  请立刻**复制**这个令牌，并把它粘贴到您刚才的那个临时记事本里。

---

## 步骤三：准备本地部署环境

在这一步，我们将完成在您自己电脑上进行部署的所有准备工作。

### 3.1 安装 Node.js 和 Wrangler

您需要在您的电脑上安装 `Node.js` 和 `wrangler` (Cloudflare的命令行工具)。

1.  **安装 Node.js**: 请访问 [https://nodejs.org/](https://nodejs.org/) 下载并安装最新的LTS版本。`npm` 会随 `Node.js` 一同被安装。
2.  **安装 Wrangler**: 打开您的**终端**或**命令行工具** (例如 `Terminal`, `PowerShell`, `cmd`)，运行以下命令来全局安装 `wrangler`:
    ```bash
    npm install -g wrangler
    ```
3.  **登录 Wrangler**: 运行以下命令，它会打开一个浏览器窗口，让您登录并授权 `wrangler` 访问您的Cloudflare账户:
    ```bash
    wrangler login
    ```

### 3.2 配置 GitHub 访问令牌

后端服务需要一个GitHub令牌来搜索源文件。

1.  在您的项目文件夹 `tvbox-source-aggregator` 的根目录，创建一个名为 `.env` 的新文件。
2.  **复制**以下内容并粘贴到 `.env` 文件中。
    ```
    # Your GitHub Personal Access Token (PAT)
    # See GitHub documentation on how to create a PAT with `public_repo` scope.
    GH_TOKEN=
    ```
3.  将您自己的**GitHub个人访问令牌 (PAT)**，粘贴到 `GH_TOKEN=` 的后面。

---

## 步骤四：部署后端 Worker

我们将使用 `wrangler.toml` 配置文件来确保部署的准确性。

### 4.1 获取并配置 KV 命名空间 ID

1.  回到您在 **步骤 1.1** 中创建的 `TVBOX_KV` 命名空间页面。
2.  在它的下方，您会找到一串 **ID**。请**复制**这串ID。
3.  打开项目根目录下的 `wrangler.toml` 文件。
4.  将 `put_your_kv_namespace_id_here` 这段占位符，替换为您刚刚复制的 **KV 命名空间 ID**。保存文件。

### 4.2 部署！

1.  确保您的**终端**或**命令行工具**仍处于项目根目录 `tvbox-source-aggregator`。
2.  **复制并粘贴**以下这行**最终的、简化的**部署命令，然后按`Enter`执行：

    ```bash
    wrangler deploy
    ```
    *   **说明**: 这个命令会自动读取 `wrangler.toml` 中的所有配置（包括Worker名称、入口文件、KV绑定），并自动从 `.env` 文件中加载 `GH_TOKEN`，完成一次精准的部署。

3.  等待命令执行完成。您应该会看到一条 `Successfully deployed` 的成功信息。

---

## 步骤五：部署前端并最终验证

(此部分内容保持不变，指南依然有效)

### 5.1 部署到 Cloudflare Pages
...
(后续内容省略，因为它们已经是正确的)
