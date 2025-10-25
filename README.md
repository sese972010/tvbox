# TVBox 源聚合器 (纯图形化部署版)

这是一个全自动的TVBox源查找、测试、合并和部署工具。它提供一个Web UI控制面板，让您可以轻松地聚合来自GitHub的最新、最快的TVBox源，并生成一个稳定、高质量的订阅地址。

**本项目已完全适配图形化部署，您无需使用任何命令行工具。**

## 功能特性

- **图形化界面**: 通过简单的Web UI启动和监控聚合任务。
- **自动搜索**: 利用GitHub API自动搜索最新的TVBox源文件。
- **有效性验证**: 自动测试源地址的可用性，过滤无效链接。
- **去重合并**: 将多个源的站点、直播源和解析规则合并，并移除重复条目。
- **全自动部署**: Fork仓库并设置密钥后，GitHub Actions会自动为您完成所有部署工作。

---

## 全图形化部署指南 (无需命令行)

请严格按照以下步骤，在GitHub和Cloudflare网站上进行操作。

### 准备工作
1.  **一个 GitHub 账号**。
2.  **一个 Cloudflare 账号** (并登录)。

### 步骤 1: Fork本项目到您的GitHub账号

1.  在当前页面的右上角，找到并点击 **"Fork"** 按钮。
2.  在弹出的页面中，确认您的用户名，然后点击 **"Create fork"**。
3.  等待几秒钟，浏览器会自动跳转到您自己账号下的项目仓库，URL看起来像 `https://github.com/你的用户名/tvbox`。接下来的所有操作都在您自己的这个仓库里进行。

### 步骤 2: 从Cloudflare获取必要信息

1.  **获取 Account ID**:
    -   打开一个新的浏览器标签页，登录Cloudflare。
    -   在主页右侧，您会看到您的 **Account ID**。请**复制**并保存下来，后面会用到。

2.  **创建 API Token**:
    -   在Cloudflare主页，点击右侧的 **"My Profile"** -> **"API Tokens"**。
    -   点击 **"Create Token"** 按钮。
    -   找到 **"Edit Cloudflare Workers"** 模板，点击 **"Use template"**。
    -   无需修改任何配置，直接滚动到底部，点击 **"Continue to summary"**。
    -   最后点击 **"Create Token"**。
    -   页面会显示您新创建的Token。请**复制**这串字符，并妥善保管。**注意：这个Token只会显示一次！**

### 步骤 3: 在GitHub仓库中设置密钥

1.  回到您在步骤1中Fork的GitHub仓库页面。
2.  点击页面顶部的 **"Settings"** -> 左侧菜单中的 **"Secrets and variables"** -> **"Actions"**。
3.  您会看到一个 **"Repository secrets"** 的区域。我们需要在这里添加三个密钥：
    -   **第一个密钥 (Cloudflare Account ID)**:
        -   点击 **"New repository secret"**。
        -   **Name**: `CLOUDFLARE_ACCOUNT_ID`
        -   **Secret**: 粘贴您在步骤2中复制的 **Account ID**。
        -   点击 **"Add secret"**。
    -   **第二个密钥 (Cloudflare API Token)**:
        -   再次点击 **"New repository secret"**。
        -   **Name**: `CLOUDFLARE_API_TOKEN`
        -   **Secret**: 粘贴您在步骤2中创建并复制的 **API Token**。
        -   点击 **"Add secret"**。
    -   **第三个密钥 (GitHub Token)**:
        -   为了让程序能搜索GitHub，需要一个GitHub自身的Token。
        -   [点击这里在新标签页中创建GitHub Token](https://github.com/settings/tokens/new)。
        -   **Note**: 随便填写一个名字，比如 `tvbox_deploy`。
        -   **Expiration**: 建议选择 `No expiration` (永不过期)。
        -   **Select scopes**: 勾选 `public_repo`。
        -   滚动到底部，点击 **"Generate token"**。
        -   **复制**生成的Token (同样，它只会显示一次)。
        -   回到您仓库的Secrets设置页面，再次点击 **"New repository secret"**。
        -   **Name**: `GITHUB_TOKEN`
        -   **Secret**: 粘贴您刚刚生成的 **GitHub Token**。
        -   点击 **"Add secret"**。

### 步骤 4: 触发首次自动部署

我们已经配置好了一切，现在需要进行一次代码修改来触发自动化流程。

1.  在您的GitHub仓库页面，点击顶部菜单的 **"< > Code"** 回到代码主页。
2.  找到并点击 `README.md` 文件。
3.  点击文件内容右上角的 **铅笔图标 (Edit this file)**。
4.  在文件末尾随便添加几个字，比如 `Hello World`。
5.  滚动到页面顶部，点击绿色的 **"Commit changes..."** 按钮，然后在弹出的窗口中再次点击 **"Commit changes"**。
6.  **部署已自动开始！** 您可以点击页面顶部的 **"Actions"** 标签页，看到一个正在运行的黄色图标的工作流，这就是机器人在帮您部署了。

### 步骤 5: 关联并获取您的网站地址

整个自动化过程大约需要2-3分钟。当您在"Actions"页面看到工作流图标变为**绿色对勾**时，说明部署已成功。

1.  **获取后端API地址**:
    -   在"Actions"页面，点击刚刚成功的工作流名称。
    -   在左侧点击 **"deploy-api"** 任务。
    -   在右侧的日志中，找到并展开 **"Deploy Worker"** 步骤。
    -   日志中会有一行 `Published tvbox-source-aggregator (dev) ...`，后面跟着的 `https://...workers.dev` 就是您的API地址。**请复制它**。

2.  **将API地址配置到前端**:
    -   回到您的GitHub仓库代码主页。
    -   依次进入 `frontend` 文件夹，然后点击 `script.js` 文件。
    -   点击右上角的 **铅笔图标 (Edit this file)**。
    -   在文件顶部，将 `const API_BASE_URL = '...'` 引号中的内容，替换为您刚刚复制的API地址。
    -   点击 **"Commit changes..."** 两次，保存文件。
    -   这次保存会**再次触发一次自动部署**，请再次前往"Actions"页面，等待新的工作流完成 (变为绿色对勾)。

3.  **获取最终UI界面地址**:
    -   等待新的工作流成功后，在日志中点击 **"deploy-ui"** 任务。
    -   展开 **"Deploy to Cloudflare Pages"** 步骤。
    -   您会在日志中看到一个 `https://tvbox-ui-....pages.dev` 的地址。**这就是您最终的控制面板地址！**

### 步骤 6: 完成！

恭喜您！现在，您可以通过浏览器访问您在上一步获得的 `...pages.dev` 地址，来使用这个强大的TVBox源聚合工具了。详细的UI操作步骤，请参照本文档下方的“UI界面使用指南”。

---

## UI界面使用指南 (详细步骤)
... (这部分内容保持不变) ...
