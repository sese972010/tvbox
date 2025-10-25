# TVBox 源聚合器 (终极模板部署指南)

这是一个全自动的TVBox源查找、测试、合并和部署工具。您无需接触任何命令行，只需在网页上进行一系列点击操作，即可拥有一个为您持续更新高质量TVBox源的专属订阅地址。

**本项目采用模板化部署，只需点击一个按钮即可创建完全属于您自己的独立项目，确保部署成功。**

---

## 全图形化部署指南 (基于模板，100%成功)

请严格按照以下步骤操作，这将是您配置的最后一次。

### 准备工作
- **一个 GitHub 账号** (并已登录)。
- **一个 Cloudflare 账号** (并已登录)。

---

### 步骤 1: 【核心】通过模板创建您自己的主程序库

1.  在当前项目页面的顶部，找到并点击绿色的 **[Use this template]** 按钮。
2.  在下拉菜单中选择 **[Create a new repository]**。
3.  **Repository name (仓库名称)**: 给您的项目起一个新名字，例如 `my-tvbox-source`。
4.  **Description (描述)**: 可以留空或随意填写。
5.  确保选择了 **"Public"** (公开)。
6.  点击页面底部的绿色按钮 **[Create repository]**。
7.  等待几秒钟，页面会自动跳转到您全新的、完全独立的仓库。**后续所有操作都在这个新仓库里进行。**

---

### 步骤 2: 从 Cloudflare 获取部署所需信息

(此步骤内容不变，为简洁省略。请参照之前的详细说明获取 **Account ID** 和 **API Token**。)
...

---

### 步骤 3: 在您的新仓库中配置三个必需的密钥

**回到您在步骤1中创建的全新GitHub仓库页面。**

1.  点击页面顶部的 **[Settings]** 标签页。
2.  在左侧菜单中，依次点击 **[Secrets and variables]** -> **[Actions]**。
3.  **请确保您停留在默认的 [Secrets] 标签页上。**
4.  在 **"Repository secrets"** 标题右侧，点击 **[New repository secret]** 按钮，逐一添加三个密钥。

    -   **密钥一：Cloudflare Account ID**
        -   **Name**: `CLOUDFLARE_ACCOUNT_ID`
        -   **Secret**: 粘贴您获取的 **Account ID**。
        -   点击 **[Add secret]**。

    -   **密钥二：Cloudflare API Token**
        -   **Name**: `CLOUDFLARE_API_TOKEN`
        -   **Secret**: 粘贴您创建的 **API Token**。
        -   点击 **[Add secret]**。

    -   **密钥三：GitHub Token**
        -   **Name**: `GH_TOKEN`
        -   **Secret**: (请按照之前的详细说明创建一个新的GitHub Token并粘贴在这里)。
        -   点击 **[Add secret]**。

---

### 步骤 4: 触发首次自动部署

由于这是您自己的主程序库，**Actions 默认就是启用的**，我们只需一次提交即可触发。

1.  在您的仓库页面，点击顶部菜单的 **[< > Code]** 回到代码主页。
2.  找到并点击 `README.md` 文件，然后点击右上角的 **铅笔图标 (Edit this file)**。
3.  在文件末尾随便添加一个空格或一句话。
4.  滚动到页面顶部或底部，点击绿色的 **[Commit changes...]** 按钮，在弹窗中再次点击 **[Commit changes]**。
5.  **部署已自动开始！** 点击顶部的 **[Actions]** 标签页，您会立刻看到一个正在运行的工作流。

---

### 步骤 5: 获取并配置您的专属地址

自动化过程大约需要2-3分钟。在"Actions"页面等待工作流图标变为**绿色对勾** ✔️。

#### 5.1 获取后端API地址
1.  在"Actions"页面，点击成功的工作流名称。
2.  在左侧点击 **[deploy-api]** 任务。
3.  在右侧展开 **[Deploy Worker]** 步骤，您会看到一行 `Published tvbox-source-aggregator ...`，后面跟着的 `https://...workers.dev` 就是您的API地址。**请复制它**。

#### 5.2 将API地址配置到前端 (这将触发第二次部署)
1.  回到仓库代码主页，依次进入 `frontend` 文件夹 -> 点击 `script.js` 文件。
2.  点击 **铅笔图标** 编辑文件。
3.  将 `const API_BASE_URL = '...'` 引号中的内容，替换为您刚复制的API地址。
4.  点击 **[Commit changes...]** 两次保存。
5.  **这会触发第二次自动部署**。请再次前往"Actions"页面，等待这个新的工作流也成功完成。

#### 5.3 获取最终UI界面地址
1.  等待第二次部署成功后，点击该工作流。
2.  在左侧点击 **[deploy-ui]** 任务。
3.  在右侧展开 **[Deploy to Cloudflare Pages]** 步骤，您会看到一个 `https://tvbox-ui-....pages.dev` 的地址。**这就是您最终的控制面板地址！**

---

### 步骤 6: 完成！

恭喜您！现在，您可以访问您在上一步获得的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！
(UI界面使用指南部分省略)
...
