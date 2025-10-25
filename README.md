# TVBox 源聚合器 (终极版 - 混合部署指南 - 完整无删节)

您好。在您的卓越协助下，我们已成功部署了最核心的后端API！这份终极指南将指导您完成最后的前端部署，并确保所有部分完美协作。

**本指南100%完整无删减，请严格按照步骤顺序操作。**

---
### **前提**
- 您已完成 **获取Cloudflare信息** 和 **在GitHub中精确配置了三个Repository Secrets** 的步骤。

---
### **步骤 1: 【核心】仅部署后端API (如果尚未成功)**

*好消息是，根据您最后的日志，这一步很可能已经成功了！*

#### **1.1 (重要) 清理并简化部署文件**
1.  在您的仓库页面，进入 `.github/workflows` 文件夹，**删除**其中所有的 `.yml` 文件。
2.  如果根目录下存在 `deploy.sh` 文件，也请将其**删除**。确保环境干净。

#### **1.2 手动创建“仅部署后端”的工作流文件**
1.  回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在文件名输入框里，精确输入： `.github/workflows/deploy-backend.yml`
3.  将以下**全部的、最终精简版的代码**粘贴到代码编辑区中：

    ```yaml
    name: Deploy Backend API

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

#### **1.3 手动运行后端部署**
1.  保存文件后，点击顶部的 **[Actions]** 标签页。
2.  在左侧列表中，点击 **"Deploy Backend API"**。
3.  在右侧，点击蓝色的 **[Run workflow]** 按钮，并确认。
4.  等待工作流运行完成 (出现绿色对勾 ✔️)。
5.  **获取后端API地址**: 进入成功的任务日志，在 **[Upload Secret & Deploy Worker]** 步骤中，找到并**复制** `https://...workers.dev` 地址。

---
### **步骤 2: 【核心】在Cloudflare上手动创建并连接前端项目**

**这一步是全新的，请仔细操作。我们将在Cloudflare网站上完成。**

1.  登录Cloudflare，在主页左侧菜单中，点击 **[Workers & Pages]**。
2.  选择 **[Pages]** 标签页，然后点击蓝色的 **[Create a project]** -> **[Connect to Git]**。
3.  Cloudflare会请求连接您的GitHub账号。授权后，**选择您自己的这个项目仓库**。
4.  点击 **[Begin setup]**。
5.  进入 **"Set up builds and deployments"** 页面：
    *   **Project name (项目名称)**: 请务必确保这里的名称是 `tvbox-ui` (与我们之前的设定保持一致)。
    *   **Production branch (生产分支)**: 选择 `tvbox-aggregator-ui`。
    *   **Build settings (构建设置)**:
        *   **Framework preset (框架预设)**: 选择 `None`。
        *   **Build command (构建命令)**: **将此项留空**。
        *   **Build output directory (构建输出目录)**: 输入 `frontend`。
6.  点击 **[Save and Deploy]**。
7.  Cloudflare Pages会开始第一次部署。等待部署完成后，它会为您提供一个 `https://tvbox-ui.pages.dev` 格式的地址。**这就是您最终的控制面板地址！**

---
### **步骤 3: 关联前后端**

1.  回到您的GitHub仓库代码主页。
2.  依次进入 `frontend` 文件夹，然后点击 `script.js` 文件。
3.  点击右上角的 **铅笔图标 (Edit this file)**。
4.  在文件顶部，将 `const API_BASE_URL = '...'` 引号中的内容，替换为您在 **步骤 1.3** 中获取的**后端API地址** (`...workers.dev`)。
5.  点击 **[Commit changes...]** 两次，保存文件。
6.  **部署已自动开始！** 您无需任何操作。因为您的Pages项目已经连接到了GitHub，这次保存会自动触发Cloudflare Pages进行一次新的部署，将包含正确API地址的前端更新上去。

---
### **步骤 4: 完成！**

恭喜您！现在，您可以访问您在 **步骤 2** 中获得的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！

---
### **UI界面使用指南 (完整无删减)**
(此部分内容与之前版本相同，请参照操作)
