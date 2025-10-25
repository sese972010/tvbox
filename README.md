# TVBox 源聚合器 (最终版手动部署指南 - 完整版)

您好！为了确保部署过程万无一失，这份最终版的指南将指导您手动创建自动化配置文件，从而绕过所有潜在的平台问题。

**本指南完整无删减，请严格按照步骤顺序操作。**

---

### **部署流程**

#### **前提：**
- 您已登录您的 GitHub 账号，并已进入本项目仓库页面。
- 您已登录您的 Cloudflare 账号。

---

### **步骤 1: 从 Cloudflare 获取部署所需信息**

**在新浏览器标签页中打开Cloudflare官网并登录。**

#### **1.1 获取 Account ID**
**Account ID 不是您的登录邮箱**，而是Cloudflare分配给您的一串32位的唯一标识符。

*   **方法一：通过网站概览页面 (最准确的方法)**
    1.  登录Cloudflare后，您会看到您的网站列表。**请点击其中任意一个网站的名称**。
    2.  进入该网站的管理页面后，请看页面的 **右侧边栏**。
    3.  **向下滚动右侧边栏**，直到您看到一个名为 **"API"** 的区域。
    4.  在这个 "API" 区域里，您会清晰地看到 **"Account ID"** (账户ID)，它旁边就有一个 **[Click to copy]** 的按钮。点击它即可复制。

*   **方法二：通过浏览器地址栏 (备用方法)**
    1.  登录Cloudflare后，看一下您浏览器顶部的地址栏。
    2.  URL的格式会是 `https://dash.cloudflare.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/`
    3.  那一长串 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` **就是您的Account ID**。

**请将这个复制好的Account ID保存到记事本里，下一步会立刻用到。**

#### **1.2 创建 API Token**
1.  在Cloudflare主页，点击右侧的 **[My Profile]** -> **[API Tokens]**。
2.  点击蓝色的 **[Create Token]** 按钮。
3.  在列表中找到 **"Edit Cloudflare Workers"** 模板，点击它右侧的 **[Use template]** 按钮。
4.  在新页面中，所有设置保持默认即可。直接滚动到页面最底部，点击 **[Continue to summary]**。
5.  点击 **[Create Token]**。
6.  页面会生成一长串字符，这就是您的API Token。**请立即点击[Copy]按钮复制并妥善保管。**

---

### **步骤 2: 在您的 GitHub 仓库中配置三个必需的密钥**

1.  **回到您自己的GitHub仓库页面。**
2.  点击页面顶部的 **[Settings]** 标签页。
3.  在左侧菜单中，依次点击 **[Secrets and variables]** -> **[Actions]**。
4.  **请确保您停留在默认的 [Secrets] 标签页上。**
5.  在 **"Repository secrets"** 这个标题的右侧，点击绿色的 **[New repository secret]** 按钮。逐一添加三个密钥。

    *   **密钥一：Cloudflare Account ID**
        *   **Name**: `CLOUDFLARE_ACCOUNT_ID`
        *   **Secret**: 粘贴您在 **步骤 1.1** 中获取的 **Account ID**。
        *   点击 **[Add secret]**。

    *   **密钥二：Cloudflare API Token**
        *   再次点击 **[New repository secret]**。
        *   **Name**: `CLOUDFLARE_API_TOKEN`
        *   **Secret**: 粘贴您在 **步骤 1.2** 中创建的 **API Token**。
        *   点击 **[Add secret]**。

    *   **密钥三：GitHub Token**
        *   再次点击 **[New repository secret]**。
        *   **Name**: `GH_TOKEN`
        *   **Secret**: (请按照之前的详细说明，创建一个新的GitHub Token并粘贴在这里)
        *   点击 **[Add secret]**。

---

### **步骤 3: 【核心】清理并手动创建工作流文件**

#### **3.1 (可选) 清理旧的工作流文件**
1.  在您的仓库页面，点击 **[< > Code]** 回到代码主页。
2.  如果 `.github` 文件夹存在，请点击进入。如果不存在，请直接跳到 **步骤 3.2**。
3.  如果 `workflows` 文件夹存在，请点击进入。
4.  如果您看到一个 `deploy.yml` 文件，请点击它，然后在右上角点击 **垃圾桶图标 (Delete file)**，并确认删除。

#### **3.2 手动创建工作流文件并触发首次部署**
1.  回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在 **"Name your file..."** 输入框里，精确输入： `.github/workflows/deploy.yml`
3.  将以下**全部代码**，完整地粘贴到下方的代码编辑区中：

    ```yaml
    name: Deploy to Cloudflare

    on:
      push:
        branches:
          - tvbox-aggregator-ui

    jobs:
      deploy-api:
        runs-on: ubuntu-latest
        name: Deploy API Worker
        steps:
          - uses: actions/checkout@v3
          - name: Use Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18'

          - name: Install dependencies
            run: npm install

          - name: Deploy Worker
            uses: cloudflare/wrangler-action@v3
            with:
              apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
              accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
              command: wrangler deploy backend/src/index.js --name tvbox-source-aggregator
              secrets: |
                GH_TOKEN

      deploy-ui:
        runs-on: ubuntu-latest
        name: Deploy UI to Pages
        needs: deploy-api
        steps:
          - uses: actions/checkout@v3
          - name: Use Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18'

          - name: Install dependencies
            run: npm install

          - name: Deploy to Cloudflare Pages
            uses: cloudflare/wrangler-action@v3
            with:
              apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
              accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
              command: wrangler pages deploy frontend --project-name=tvbox-ui --commit-dirty=true
    ```

4.  代码粘贴完成后，点击 **[Commit changes...]** 两次确认保存。
5.  **部署已自动开始！** 点击顶部的 **[Actions]** 标签页，您现在一定能看到一个正在运行的工作流了。

---

### **步骤 4: 获取并配置您的专属地址**

自动化过程约2-3分钟。在"Actions"页面等待工作流图标变为**绿色对勾** ✔️。

#### **4.1 获取后端API地址**
1.  在"Actions"页面，点击成功的工作流名称。
2.  左侧点击 **[deploy-api]** 任务。
3.  右侧展开 **[Deploy Worker]** 步骤，找到 `https://...workers.dev` 地址并**复制**。

#### **4.2 将API地址配置到前端 (将触发第二次部署)**
1.  回到代码主页，进入 `frontend` -> `script.js`。
2.  点击 **铅笔图标** 编辑。
3.  将 `const API_BASE_URL = '...'` 引号中的内容，替换为您刚复制的API地址。
4.  点击 **[Commit changes...]** 两次保存。
5.  **这将触发第二次自动部署**。请再次前往"Actions"页面，等待它完成。

#### **4.3 获取最终UI界面地址**
1.  等待第二次部署成功后，点击该工作流。
2.  左侧点击 **[deploy-ui]** 任务。
3.  右侧展开 **[Deploy to Cloudflare Pages]** 步骤，找到 `https://tvbox-ui-....pages.dev` 地址。**这就是您最终的控制面板地址！**

---

### **步骤 5: 完成！**

恭喜！现在，您可以访问您的 `...pages.dev` 地址，开始使用工具了。

---
### **UI界面使用指南 (完整无删减)**

1.  **访问**: 在浏览器输入您获取的 `...pages.dev` 地址。
2.  **发起任务**:
    *   在输入框中可输入特定关键字 (如“饭太硬”)，或留空使用默认。
    *   点击 **“开始聚合”** 按钮。
3.  **观察进度**:
    *   按钮会变为灰色不可点。
    *   下方“实时日志”区域会显示后台任务的每一步进展。
    *   请耐心等待约1-2分钟，直到日志显示 **“任务成功结束”**。
4.  **下载订阅**:
    *   任务完成后，“聚合订阅链接”区域会出现蓝色下载链接。
    *   **点击此链接**，浏览器会自动下载 `tvbox_source.json` 文件。
    *   此文件即可用于您的TVBox应用。
