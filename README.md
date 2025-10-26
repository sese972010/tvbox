# TVBox 源聚合器 (终极版 - 手动关联部署指南 - 完整无删节)

您好！这份终极指南将引导您采用最稳健、最清晰的“前后端分离”部署方案，从一个全新的、干净的环境开始，一步步完成项目的所有部署。它凝聚了我们所有的经验教训，旨在为您提供一个万无一失的一站式部署体验。

**本指南100%完整无删减，请严格按照步骤顺序操作。**

---
### **前提**
- 您已登录您的 **GitHub** 账号。
- 您已登录您全新的、**正确的 Cloudflare** 账号。

---
### **步骤 1: 在您的 GitHub 账号下创建独立的程序库**

1.  **打开 GitHub 网站**。点击页面右上角的 **加号 `+` 图标** -> **[Import repository]**。
2.  在 **"Your old repository’s clone URL"** 输入框里，粘贴本项目原始仓库的地址：
    `https://github.com/sese972010/tvbox.git`
3.  **Repository name**: 给您的项目起一个新名字，例如 `my-tvbox-source`。
4.  确保选择了 **"Public"** (公开)。
5.  点击 **[Begin import]** 按钮。
6.  等待导入完成后，点击进入您自己的、已经包含所有代码的仓库主页。

---
### **步骤 2: 从 Cloudflare 获取部署信息**

#### **2.1 获取 Account ID**
1.  登录您**正确的Cloudflare账号**后，点击任意网站进入管理页面 (如果没有网站，可按提示随意添加一个)。
2.  在网站管理页面的 **右侧边栏**，**向下滚动**，在 **"API"** 区域下方，找到并**复制**您的 **"Account ID"**。

#### **2.2 创建 API Token**
1.  在Cloudflare主页，点击 **[My Profile]** -> **[API Tokens]**。
2.  点击 **[Create Token]** -> 找到 **"Edit Cloudflare Workers"** 模板并点击 **[Use template]**。
3.  无需修改，滚动到底部，点击 **[Continue to summary]** -> **[Create Token]**。
4.  **立即复制**生成的Token并妥善保管。

---
### **步骤 3: 在 GitHub 仓库中精确地配置密钥**

1.  回到您在**步骤1**中创建的仓库，点击 **[Settings]** -> **[Secrets and variables]** -> **[Actions]**。
2.  **请确保您停留在 [Secrets] 标签页下**，点击 **[New repository secret]**。

    *   **密钥一：Cloudflare Account ID**
        *   **Name**: `CLOUDFLARE_ACCOUNT_ID`
        *   **Secret**: 粘贴您在 **步骤 2.1** 中获取的 **Account ID**。
        *   点击 **[Add secret]**。

    *   **密钥二：Cloudflare API Token**
        *   **Name**: `CLOUDFLARE_API_TOKEN`
        *   **Secret**: 粘贴您在 **步骤 2.2** 中创建的 **API Token**。
        *   点击 **[Add secret]**。

    *   **密钥三：GitHub Token**
        *   **Name**: `GH_TOKEN`
        *   **Secret**: (请按照之前的详细说明，创建一个新的、拥有`public_repo`权限的GitHub Token并粘贴在这里)。
        *   点击 **[Add secret]**。

---
### **步骤 4: 创建并运行“仅部署后端”的工作流**

#### **4.1 手动创建工作流文件**
1.  回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在文件名输入框里，精确输入： `.github/workflows/deploy-backend.yml`
3.  将以下**全部的、最终精简版的代码**粘贴到代码编辑区中：
    ```yaml
    name: Deploy Backend API (Manual)
    on:
      workflow_dispatch:
    jobs:
      deploy:
        runs-on: ubuntu-latest
        name: Deploy Worker API to Cloudflare
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        steps:
          - name: Checkout Code
            uses: actions/checkout@v3
          - name: Setup Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '20'
          - name: Install Dependencies
            run: npm install
          - name: Upload Secret & Deploy Worker
            run: |
              cd ./backend
              echo $GH_TOKEN | npx wrangler secret put GH_TOKEN
              npx wrangler deploy src/index.js
    ```
4.  点击 **[Commit changes...]** 两次确认保存。

#### **4.2 手动运行后端部署并获取API地址**
1.  保存文件后，点击顶部的 **[Actions]** 标签页。
2.  在左侧列表中，点击 **"Deploy Backend API (Manual)"**。
3.  在右侧，点击蓝色的 **[Run workflow]** 按钮，并确认。
4.  等待工作流运行完成 (出现**绿色对勾** ✔️)。
5.  进入成功的任务日志，在 **[Upload Secret & Deploy Worker]** 步骤中，找到并**复制** `https://...workers.dev` 地址。**这个地址至关重要，请保存好。**

---
### **步骤 5: 手动创建并关联前端项目**

#### **5.1 在Cloudflare上手动创建前端项目**
1.  登录Cloudflare，在左侧菜单点击 **[Workers & Pages]** -> **[Pages]** 标签页 -> **[Create a project]** -> **[Connect to Git]**。
2.  授权并**选择您自己的这个项目仓库**。
3.  点击 **[Begin setup]**。
4.  进入 **"Set up builds and deployments"** 页面：
    *   **Project name**: `tvbox-ui`
    *   **Production branch**: `tvbox-aggregator-ui`
    *   **Build settings**:
        *   **Framework preset**: 选择 `None`。
        *   **Build command**: **留空**。
        *   **Build output directory**: 输入 `frontend`。
5.  点击 **[Save and Deploy]**。
6.  等待部署完成后，它会为您提供一个 `https://tvbox-ui.pages.dev` 格式的地址。**这就是您最终的控制面板地址！**

#### **5.2 【最终核心步骤】手动将后端地址填入前端代码**
1.  回到您的GitHub仓库代码主页。
2.  依次进入 `frontend` 文件夹 -> 点击 `script.js` 文件 -> 点击 **铅笔图标** 编辑。
3.  在文件顶部，将 `const API_BASE_URL = '...'` 引号中的内容，替换为您在 **步骤 4.2** 中获取的**后端API地址** (`...workers.dev`)。
4.  点击 **[Commit changes...]** 两次，保存文件。
5.  **自动更新**：您无需任何操作。因为您的Pages项目已经连接到了GitHub，这次保存会自动触发Cloudflare Pages进行一次新的部署，将包含正确API地址的前端更新上去。

---
### **步骤 6: 完成！**

恭喜您！现在，您可以访问您在 **步骤 5.1** 中获得的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！

---
### **UI界面使用指南 (完整无删减)**

*   **访问**: 在浏览器输入您在 **步骤 5.1** 中获得的 `...pages.dev` 地址。
*   **发起任务**: 在UI界面的输入框中可输入关键字或留空，然后点击 **“开始聚合”** 按钮。
*   **观察进度**: 下方“实时日志”区域会显示后台任务的进展。
*   **下载订阅**: 任务完成后，“聚合订阅链接”区域会出现蓝色下载链接。点击即可下载 `tvbox_source.json` 文件。
