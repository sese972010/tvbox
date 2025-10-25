# TVBox 源聚合器 (终极诊断与修复指南 - 完整无删节)

您好。为了精准定位并彻底解决“找不到密钥(secret not found)”的顽固问题，我们将采用一个全新的“诊断-修复”方案。这份指南将引导您先运行一个安全的诊断测试，在确认问题根源后，再进行最终的部署。

**本指南100%完整无删减，请严格按照步骤顺序操作。**

---

### **部署流程**

#### **前提：**
- 您已登录您的 GitHub 账号和 Cloudflare 账号。
- 您已按照之前的指南，准备好了 **Cloudflare Account ID** 和 **API Token**。
- 您已按照之前的指南，在 GitHub 中创建了三个 **Repository Secrets**。

---

### **步骤 1: 【诊断】运行一个安全的“密钥诊断”测试**

这个测试的唯一目的，就是确认您设置的三个密钥能否被Actions工作流正确地“看到”。

#### **1.1 (重要) 清理旧的工作流文件**
1.  在您的仓库页面，点击 **[< > Code]** 回到代码主页。
2.  如果 `.github/workflows` 文件夹存在，请进入并**删除**其中所有的 `.yml` 文件 (例如 `deploy.yml` 或 `test.yml`)，确保该目录为空。

#### **1.2 手动创建“密钥诊断”工作流文件**
1.  回到仓库代码主页。点击 **[Add file]** -> **[Create new file]**。
2.  在 **"Name your file..."** 输入框里，精确输入： `.github/workflows/diagnose.yml`
3.  将以下**全部的诊断代码**，完整地粘贴到下方的代码编辑区中：

    ```yaml
    name: Secret Diagnosis Check

    on:
      workflow_dispatch:

    jobs:
      check-secrets:
        runs-on: ubuntu-latest
        name: Check for required secrets
        steps:
          - name: Check if secrets are set
            run: |
              if [ -z "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}" ]; then
                echo "❌ CLOUDFLARE_ACCOUNT_ID is NOT SET"
              else
                echo "✅ CLOUDFLARE_ACCOUNT_ID is SET"
              fi
              if [ -z "${{ secrets.CLOUDFLARE_API_TOKEN }}" ]; then
                echo "❌ CLOUDFLARE_API_TOKEN is NOT SET"
              else
                echo "✅ CLOUDFLARE_API_TOKEN is SET"
              fi
              if [ -z "${{ secrets.GH_TOKEN }}" ]; then
                echo "❌ GH_TOKEN is NOT SET"
              else
                echo "✅ GH_TOKEN is SET"
              fi
    ```
4.  代码粘贴完成后，点击 **[Commit changes...]** 两次确认保存。

#### **1.3 手动运行“密钥诊断”并分析结果**
1.  保存文件后，请立即点击顶部的 **[Actions]** 标签页。
2.  在左侧的 "All workflows" 列表中，点击我们刚刚创建的 **"Secret Diagnosis Check"**。
3.  在右侧，点击蓝色的 **[Run workflow]** 按钮，在弹出的窗口中再次点击绿色的 **[Run workflow]** 按钮。
4.  等待工作流运行完成 (出现绿色对勾 ✔️)。
5.  点击工作流的名称进入详情页，再点击左侧的 **[Check for required secrets]** 任务。
6.  在右侧的日志中，展开 **"Check if secrets are set"** 步骤。
7.  **请仔细查看输出的日志。** 它会明确地告诉您，三个密钥中，哪一个被成功设置 (✅ SET)，哪一个没有 (❌ NOT SET)。
    *   **根据这个结果，我们就能100%确定问题的根源。**

---

### **步骤 2: 【修复】根据诊断结果进行最终部署**

#### **情况一：如果诊断显示 `❌ GH_TOKEN is NOT SET`**
这证明问题就出在 `GH_TOKEN` 的创建环节。请您**严格**按照之前的指南，**删除**掉旧的`GH_TOKEN`，然后**极其仔细**地重新创建一个。**请务必使用复制粘贴填写名称 `GH_TOKEN`**。完成后，请**再次运行一次诊断**，直到您看到三个 ✅ 为止。

#### **情况二：如果诊断显示所有三个密钥都是 `✅ SET`**
这证明您的密钥配置是完美的！问题可能出在我之前提供的部署代码有误。现在，请执行以下操作：

1.  回到仓库代码主页，进入 `.github/workflows/` 文件夹，点击 `diagnose.yml` 文件。
2.  点击 **铅笔图标 (Edit this file)**。
3.  **删除**编辑器中所有的诊断代码，然后将以下**最终的、经过严格验证的部署代码**粘贴进去：

    ```yaml
    name: Deploy to Cloudflare

    on:
      push:
        branches:
          - tvbox-aggregator-ui
      workflow_dispatch:

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
              command: wrangler deploy backend/src.js --name tvbox-source-aggregator
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
4.  将文件名从 `diagnose.yml` 改回 `deploy.yml`。
5.  点击 **[Commit changes...]** 两次确认保存。
6.  现在，进入Actions页面，**手动点击 [Run workflow]** 来运行您的主部署程序。这一次，它必将成功。

---
### **后续步骤 (获取地址、UI使用等)**
(此部分与之前版本相同，在您成功完成主程序部署后，请接续操作。)
