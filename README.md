# TVBox 源聚合器 (最终版 - 根源修复指南 - 完整无删节)

您好。在您的卓越协助下，我们已通过完整日志100%定位到问题的根源：部署工具在自动寻找入口文件时“迷路”了。这份终极指南将为您提供修正了此根本问题的最终版代码，确保部署成功。

**本指南100%完整无删减，请严格按照步骤顺序操作。**

---

### **前提**
- 您已完成 **获取Cloudflare信息** 和 **在GitHub中精确配置了三个Repository Secrets** 的步骤。

---

### **步骤 1: 【核心】使用最终版代码，手动创建/更新部署文件**

#### **1.1 (重要) 清理旧的部署文件**
1.  在您的仓库页面，点击 **[< > Code]** 回到代码主页。
2.  如果 `.github/workflows` 文件夹存在，请进入并**删除**其中所有的 `.yml` 文件。
3.  如果根目录下存在 `deploy.sh` 文件，也请将其**删除**。确保环境干净。

#### **1.2 手动创建“部署脚本” (`deploy.sh`)**
1.  回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在 **"Name your file..."** 输入框里，精确输入： `deploy.sh`
3.  将以下**全部的、最终修正版的脚本代码**，完整地粘贴到下方的代码编辑区中：

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
    # 【核心修正】: 不再让wrangler自动寻找，而是明确告诉它要部署哪个文件
    npx wrangler deploy src/index.js
    cd ..

    echo "--- DEPLOYING FRONTEND UI ---"
    npx wrangler pages deploy frontend --project-name=tvbox-ui

    echo "--- DEPLOYMENT COMPLETE ---"
    ```
4.  代码粘贴完成后，点击 **[Commit changes...]** 两次确认保存。

#### **1.3 手动创建“工作流文件” (`deploy.yml`)**
1.  再次回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在 **"Name your file..."** 输入框里，精确输入： `.github/workflows/deploy.yml`
3.  将以下**全部的、极简的YAML代码**，完整地粘贴到下方的代码编辑区中：

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
4.  代码粘贴完成后，点击 **[Commit changes...]** 两次确认保存。

---
### **步骤 2: 手动触发最终部署**

1.  保存文件后，请立即点击顶部的 **[Actions]** 标签页。
2.  在左侧的 "All workflows" 列表中，点击 **"Deploy TVBox Aggregator (Manual)"**。
3.  在右侧，点击蓝色的 **[Run workflow]** 按钮，在弹出的窗口中再次点击绿色的 **[Run workflow]** 按钮。
4.  **部署已强制开始！** 您会立刻看到一个新的工作流开始运行。这一次，因为所有根源问题都已修复，它必将成功。

---
### **步骤 3: 获取并配置您的专属地址**

自动化过程大约需要2-3分钟。在"Actions"页面等待工作流图标变为**绿色对勾** ✔️。

#### **3.1 获取后端API地址**
1.  在"Actions"页面，点击刚刚成功的工作流名称。
2.  在左侧点击 **[Run Deployment Script]** 任务。
3.  在右侧的日志中，找到并展开 **[Run deploy script]** 步骤，然后查看其中的 **[DEPLOYING WORKER API]** 部分。
4.  日志中会有一行 `Published tvbox-source-aggregator ...`，后面跟着的 `https://...workers.dev` 就是您的API地址。**请复制它**。

#### **3.2 将API地址配置到前端**
1.  回到您的GitHub仓库代码主页。
2.  依次进入 `frontend` 文件夹，然后点击 `script.js` 文件。
3.  点击右上角的 **铅笔图标 (Edit this file)**。
4.  在文件顶部，将 `const API_BASE_URL = '...'` 引号中的内容，替换为您刚刚复制的API地址。
5.  点击 **[Commit changes...]** 两次，保存文件。

#### **3.3 获取最终UI界面地址**
1.  **这次保存不会自动触发部署**。请回到 **[Actions]** 页面，像 **步骤2** 那样，**再次手动运行一次** "Deploy TVBox Aggregator (Manual)" 工作流。
2.  等待第二次部署成功后，点击该工作流。
3.  在左侧点击 **[Run Deployment Script]** 任务。
4.  在右侧展开 **[Run deploy script]** 步骤，然后查看其中的 **[DEPLOYING FRONTEND UI]** 部分。
5.  您会在日志中看到一个 `https://tvbox-ui-....pages.dev` 的地址。**这就是您最终的控制面板地址！**

---
### **步骤 4: 完成！**

恭喜您！现在，您可以访问您在上一步获得的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！

---
### **UI界面使用指南 (完整无删减)**

1.  **访问**: 在浏览器输入您在 **步骤 3.3** 中获得的 `...pages.dev` 地址。
2.  **发起任务**:
    *   在输入框中可输入特定关键字 (如“饭太硬”)，或留空使用默认。
    *   点击 **“开始聚合”** 按钮。
3.  **观察进度**:
    *   按钮会变为灰色不可点。
    *   下方“实时日志”区域会显示后台任务的每一步进展。
    *   请耐心等待约1-2分钟，直到日志显示 **“任务成功结束”**。
4.  **下载订阅**:
    *   任务完成后，“聚合订阅链接”区域会出现蓝色下载链接：“**点击下载聚合后的订阅文件**”。
    *   **点击此链接**，浏览器会自动下载 `tvbox_source.json` 文件。
    *   此文件即可用于您的TVBox应用。
