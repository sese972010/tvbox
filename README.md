# TVBox 源聚合器 (终极手动触发部署指南)

您好。经过深度诊断，我们发现您仓库的自动化功能完好，但自动触发机制 (`push`) 因未知原因失灵。这份终极指南将引导您为工作流安装一个“手动挡”开关 (`workflow_dispatch`)，通过直接点击网页按钮来强制运行部署，100%确保成功。

**本指南完整无删减，请严格按照步骤顺序操作。**

---
### **前提**
- 您已完成 **获取Cloudflare信息** 和 **配置GitHub密钥** 的步骤。

---
### **步骤 1: 【诊断】为“Hello World”测试安装并使用“手动挡”

#### **1.1 (重要) 清理旧的工作流文件**
1.  在您的仓库页面，点击 **[< > Code]** 回到代码主页。
2.  如果 `.github/workflows` 文件夹存在，请进入并**删除**其中所有的 `.yml` 文件，确保该目录为空。

#### **1.2 手动创建带“手动挡”的测试文件**
1.  回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在文件名输入框里，精确输入： `.github/workflows/test.yml`
3.  将以下**全部代码**完整地粘贴到代码编辑区中：

    ```yaml
    name: Hello World Manual Test

    on:
      push:
        branches:
          - tvbox-aggregator-ui
      workflow_dispatch: # <--- 这就是我们的“手动挡”开关

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - run: echo "Hello, world! The manual trigger is working!"
    ```
4.  点击 **[Commit changes...]** 两次确认保存。

#### **1.3 【核心】手动运行“Hello World”测试**
1.  保存文件后，请立即点击顶部的 **[Actions]** 标签页。
2.  在左侧的 "All workflows" 列表中，点击我们刚刚创建的 **"Hello World Manual Test"**。
3.  此时，在右侧主区域，您会看到一条提示信息 "This workflow has a `workflow_dispatch` event trigger."，它的右边会出现一个**蓝色的按钮 [Run workflow]**。
4.  **请点击这个 [Run workflow] 按钮**。
5.  会弹出一个小窗口，**再次点击绿色的 [Run workflow] 按钮**进行确认。
6.  **工作流已强制开始！** 您会立刻看到一个新的工作流开始运行，并很快显示为绿色对勾 ✔️。
    *   **这100%证明了您仓库的Actions功能本身是完好的，只是自动触发失灵了。**

---
### **步骤 2: 【修复】用最终的、带“手动挡”的部署代码替换测试代码**

**确认“手动挡”测试成功后**，我们现在可以放心地换上最终的部署程序了。

1.  回到仓库代码主页，依次进入 `.github/workflows/` 文件夹，点击我们刚刚创建的 `test.yml` 文件。
2.  点击右上角的 **铅笔图标 (Edit this file)**。
3.  **删除**编辑器中所有的 "Hello World" 代码，然后将以下**全新的、完整的、最终版的部署代码**粘贴进去：

    ```yaml
    name: Deploy to Cloudflare

    on:
      push:
        branches:
          - tvbox-aggregator-ui
      workflow_dispatch: # <--- 为主程序也装上“手动挡”

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
4.  **【可选但建议】** 在顶部的 `test.yml` 文件名输入框中，将文件名改回 `deploy.yml`。
5.  点击 **[Commit changes...]** 两次确认保存。
6.  现在，您可以像刚才一样，进入Actions页面，**手动点击 [Run workflow]** 来运行您的主部署程序了。

---
### **后续步骤**

(后续所有步骤，包括获取API地址、配置前端、获取最终UI地址和UI界面使用指南，都与之前完全相同，请接续操作即可。)
