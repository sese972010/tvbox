# TVBox 源聚合器 (终极版 - 从零开始部署指南 - 完整无删节)

您好！这份终极指南将引导您从一个全新的、干净的环境开始，一步步完成项目的所有部署。它凝聚了我们所有的经验教训，旨在为您提供一个清晰、详尽、万无一失的一站式部署体验。

**本指南100%完整无删减，请严格按照步骤顺序操作。**

---

### **部署流程**

#### **前提：**
- 您已登录您的 **GitHub** 账号。
- 您已登录您全新的、**正确的 Cloudflare** 账号。

---

### **步骤 1: 【起点】通过导入，创建您自己的独立主程序库**

这将为您创建一个全新的、100%属于您自己的、不受任何限制的项目仓库。

1.  **打开 GitHub 网站**。点击页面右上角的 **加号 `+` 图标**，在下拉菜单中选择 **[Import repository]**。
2.  进入 **"Import your project to GitHub"** 页面:
    *   在 **"Your old repository’s clone URL"** (您旧仓库的克隆URL) 输入框里，粘贴本项目原始仓库的地址：
        `https://github.com/sese972010/tvbox.git`
    *   **Repository name (仓库名称)**: 给您的项目起一个新名字，例如 `my-tvbox-source`。
    *   确保选择了 **"Public"** (公开)。
3.  点击页面底部的 **[Begin import]** 按钮。
4.  导入过程通常在1分钟内完成。当您看到绿色的对勾 ✔️ 和 "Import complete!" 字样时，**点击仓库名称链接**，进入您自己的、已经包含所有代码的仓库主页。
5.  **后续所有操作都在这个您亲手创建并导入了代码的仓库里进行。**

---

### **步骤 2: 从您正确的 Cloudflare 账号获取部署信息**

#### **2.1 获取 Account ID**
1.  登录您**正确的Cloudflare账号**后，点击任意网站进入管理页面 (如果没有网站，可按提示随意添加一个)。
2.  在网站管理页面的 **右侧边栏**，**向下滚动**，在 **"API"** 区域下方，找到并**复制**您的 **"Account ID"**。

#### **2.2 创建 API Token**
1.  在Cloudflare主页，点击右侧的 **[My Profile]** -> **[API Tokens]**。
2.  点击 **[Create Token]** -> 找到 **"Edit Cloudflare Workers"** 模板并点击 **[Use template]**。
3.  无需修改，滚动到底部，点击 **[Continue to summary]** -> **[Create Token]**。
4.  **立即复制**生成的Token并妥善保管。

---

### **步骤 3: 在您的 GitHub 仓库中精确地配置三个密钥**

1.  回到您在**步骤1**中创建的仓库，点击 **[Settings]** -> **[Secrets and variables]** -> **[Actions]**。
2.  **请确保您停留在 [Secrets] 标签页下**，在 **"Repository secrets"** 标题右侧，点击 **[New repository secret]**。

    *   **密钥一：Cloudflare Account ID**
        *   **Name**: `CLOUDFLARE_ACCOUNT_ID` (请复制粘贴)
        *   **Secret**: 粘贴您在 **步骤 2.1** 中获取的 **Account ID**。
        *   点击 **[Add secret]**。

    *   **密钥二：Cloudflare API Token**
        *   再次点击 **[New repository secret]**。
        *   **Name**: `CLOUDFLARE_API_TOKEN` (请复制粘贴)
        *   **Secret**: 粘贴您在 **步骤 2.2** 中创建的 **API Token**。
        *   点击 **[Add secret]**。

    *   **密钥三：GitHub Token**
        *   再次点击 **[New repository secret]**。
        *   **Name**: `GH_TOKEN` (请复制粘贴)
        *   **Secret**: (请按照之前的详细说明，创建一个新的、拥有`public_repo`权限的GitHub Token并粘贴在这里)。
        *   点击 **[Add secret]**。

---

### **步骤 4: 手动创建最终版的部署文件**

#### **4.1 创建“部署脚本” (`deploy.sh`)**
1.  回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在文件名输入框里，精确输入： `deploy.sh`
3.  将以下**全部的脚本代码**，完整地粘贴到代码编辑区中：

    ```bash
    #!/bin/bash
    set -e

    echo "--- INSTALLING DEPENDENCIES ---"
    npm install

    echo "--- UPLOADING SECRET TO WORKER ---"
    cd ./backend
    echo $GH_TOKEN | npx wrangler secret put GH_TOKEN
    cd ..

    echo "--- DEPLOYING WORKER API ---"
    cd ./backend
    npx wrangler deploy src/index.js
    cd ..

    echo "--- DEPLOYING FRONTEND UI ---"
    npx wrangler pages deploy frontend --project-name=tvbox-ui

    echo "--- DEPLOYMENT COMPLETE ---"
    ```
4.  点击 **[Commit changes...]** 两次确认保存。

#### **4.2 创建“工作流文件” (`deploy.yml`)**
1.  再次回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在文件名输入框里，精确输入： `.github/workflows/deploy.yml`
3.  将以下**全部的YAML代码**，完整地粘贴到代码编辑区中：

    ```yaml
    name: Deploy TVBox Aggregator (Manual)

    on:
      workflow_dispatch:

    jobs:
      deploy:
        runs-on: ubuntu-latest
        name: Run Deployment Script
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
          - name: Make deploy script executable
            run: chmod +x deploy.sh
          - name: Run deploy script
            run: ./deploy.sh
    ```
4.  点击 **[Commit changes...]** 两次确认保存。

---
### **步骤 5: 手动触发部署并获取地址**

#### **5.1 手动运行部署**
1.  保存文件后，点击顶部的 **[Actions]** 标签页。
2.  在左侧列表中，点击 **"Deploy TVBox Aggregator (Manual)"**。
3.  在右侧，点击蓝色的 **[Run workflow]** 按钮，并确认。
4.  等待工作流运行完成 (出现**绿色对勾** ✔️)。

#### **5.2 获取后端API地址**
1.  进入成功的任务日志，在 **[Run deploy script]** 步骤的 **[DEPLOYING WORKER API]** 部分，找到并**复制** `https://...workers.dev` 地址。

#### **5.3 关联前端并再次部署**
1.  回到仓库，进入 `frontend/script.js` 文件并编辑。
2.  将 `const API_BASE_URL` 的值替换为您刚复制的后端API地址。
3.  **保存文件** (点击 "Commit changes..." 两次)。
4.  **再次回到 [Actions] 页面，像 步骤 5.1 那样，再次手动运行一次工作流**，以上传更新后的前端。

#### **5.4 获取最终UI界面地址**
1.  等待第二次部署成功后，进入任务日志。
2.  在 **[Run deploy script]** 步骤的 **[DEPLOYING FRONTEND UI]** 部分，您会看到一个 `https://tvbox-ui-....pages.dev` 的地址。**这就是您最终的控制面板地址！**

---
### **步骤 6: 完成！**

恭喜您！现在，您可以访问您的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！

---
### **UI界面使用指南 (完整无删减)**

1.  **访问**: 在浏览器输入您在 **步骤 5.4** 中获得的 `...pages.dev` 地址。
2.  **发起任务**: 在输入框中可输入关键字或留空，然后点击 **“开始聚合”** 按钮。
3.  **观察进度**: 下方“实时日志”区域会显示后台任务的进展。
4.  **下载订阅**: 任务完成后，“聚合订阅链接”区域会出现蓝色下载链接。点击即可下载 `tvbox_source.json` 文件。
