# TVBox 源聚合器 (终极手动部署指南)

您好！为了确保部署过程万无一失，这份最终版的指南将指导您手动创建自动化配置文件，从而绕过所有潜在的平台问题。

**本指南完整无删减，请严格按照步骤顺序操作。**

---

### **部署流程**

#### **前提：**
- 您已登录您的 GitHub 账号，并已进入本项目仓库页面。
- 您已登录您的 Cloudflare 账号。

---

### **步骤 1: 从 Cloudflare 获取部署所需信息**
(此步骤内容不变，请按照之前的详细说明获取 **Account ID** 和 **API Token**。)

---

### **步骤 2: 在您的 GitHub 仓库中配置三个必需的密钥**
(此步骤内容不变，请按照之前的详细说明配置 `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, 和 `GH_TOKEN`。)

---

### **步骤 3: 【核心】手动创建工作流文件并触发首次部署**

这一步将替代之前所有“修改文件来触发”的操作。创建并保存这个文件本身，就是触发部署的命令。

1.  在您的仓库页面，点击顶部菜单的 **[< > Code]** 回到代码主页。
2.  在文件列表的右上方，找到并点击 **[Add file]** 按钮，在下拉菜单中选择 **[Create new file]**。
3.  您会进入一个新的文件编辑页面。在页面顶部的 **"Name your file..."** 输入框里，请**精确地**输入以下路径和文件名：
    `.github/workflows/deploy.yml`
    *注意：当您输入 `.github/` 后，界面会自动创建一个文件夹层级，这是正常的。*

4.  文件名输入正确后，请将以下**全部代码**，完整地粘贴到下方的代码编辑区中：

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

5.  代码粘贴完成后，滚动到页面顶部，点击绿色的 **[Commit changes...]** 按钮，在弹出的窗口中再次点击 **[Commit changes]**。
6.  **部署已自动开始！** 点击顶部的 **[Actions]** 标签页，您现在一定能看到一个正在运行的工作流了。因为这是您亲手创建的，它会被系统立刻识别并执行。

---

### **步骤 4: 获取并配置您的专属地址**
(此步骤及后续步骤内容不变，请按照之前的详细说明操作。)

---
### **步骤 5: 完成！**
(此步骤及后续步骤内容不变，请按照之前的详细说明操作。)

---
### **UI界面使用指南 (完整无删减)**
(此步骤及后续步骤内容不变，请按照之前的详细说明操作。)
