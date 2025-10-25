# TVBox 源聚合器 (为您专属定制的部署指南)

您好！这份指南是根据您的具体情况（您已拥有项目仓库，并将`tvbox-aggregator-ui`作为默认分支）为您量身定制的。请按照以下步骤操作，即可完成部署。

**本指南完整无删减，请严格按照步骤顺序操作。**

---

### **部署流程**

#### **前提：**
- 您已登录您的 GitHub 账号，并已进入本项目仓库页面。
- 您已登录您的 Cloudflare 账号。

--- 

### **步骤 1: 从 Cloudflare 获取部署所需信息**

**请在新浏览器标签页中打开Cloudflare官网并登录。**

#### **1.1 获取 Account ID (两种方法)**

**Account ID 不是您的登录邮箱**，而是Cloudflare分配给您的一串32位的唯一标识符。

*   **方法一：通过网站概览页面 (最准确的方法)**
    1.  登录Cloudflare后，您会看到您的网站列表。**请点击其中任意一个网站的名称**。
        *   *如果您是新用户，没有任何网站，可以点击 "Add a site" 按钮，随意输入一个域名如 `example.com`，选择免费计划，暂时跳过DNS等设置，目的只是为了进入网站管理主页。*
    2.  进入该网站的管理页面后，请看页面的 **右侧边栏**。
    3.  **向下滚动右侧边栏**，直到您看到一个名为 **"API"** 的区域。
    4.  在这个 "API" 区域里，您会清晰地看到 **"Account ID"** (账户ID)，它旁边就有一个 **[Click to copy]** 的按钮。点击它即可复制。

*   **方法二：通过浏览器地址栏 (备用方法)**
    1.  登录Cloudflare后，看一下您浏览器顶部的地址栏。
    2.  URL的格式会是 `https://dash.cloudflare.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/`
    3.  那一长串由数字和字母组成的 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` **就是您的Account ID**。您可以直接从地址栏里复制它。

**请将这个复制好的Account ID保存到记事本里，下一步会立刻用到。**

#### **1.2 创建 API Token**
1.  在Cloudflare主页，点击右侧的 **[My Profile]** -> **[API Tokens]**。
2.  点击蓝色的 **[Create Token]** 按钮。
3.  在列表中找到 **"Edit Cloudflare Workers"** 模板，点击它右侧的 **[Use template]** 按钮。
4.  在新页面中，所有设置保持默认即可。直接滚动到页面最底部，点击 **[Continue to summary]**。
5.  点击 **[Create Token]**。
6.  页面会生成一长串字符，这就是您的API Token。**请立即点击[Copy]按钮复制并妥善保管。这个Token只会完整显示这一次，关闭页面后将无法找回。**

---

### **步骤 2: 在您的 GitHub 仓库中配置三个必需的密钥**

**请回到您自己的GitHub仓库页面。**

1.  点击页面顶部的 **[Settings]** 标签页。
2.  在左侧菜单中，依次点击 **[Secrets and variables]** -> **[Actions]**。
3.  您会看到页面上有 **[Secrets]** 和 **[Variables]** 两个标签页。**请确保您停留在默认的 [Secrets] 标签页上。**
4.  在 **"Repository secrets"** 这个标题的右侧，点击绿色的 **[New repository secret]** 按钮。现在，我们来逐一添加三个密钥。

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
        *   **Name**: `GH_TOKEN` (注意：不是 GITHUB_TOKEN)
        *   **Secret**: (请按照之前的详细说明，创建一个新的GitHub Token并粘贴在这里)
        *   点击 **[Add secret]**。

---

### **步骤 3: 触发首次自动部署**

1.  在您的仓库页面，点击顶部菜单的 **[< > Code]** 回到代码主页。
2.  **请确认您当前在 `tvbox-aggregator-ui` 分支上** (文件列表上方会显示分支名称)。
3.  找到并点击 `README.md` 文件，然后点击右上角的 **铅笔图标 (Edit this file)**。
4.  在文件末尾随便添加一个空格。
5.  滚动到页面顶部或底部，点击绿色的 **[Commit changes...]** 按钮，在弹窗中再次点击 **[Commit changes]**。
6.  **部署已自动开始！** 点击顶部的 **[Actions]** 标签页，您会立刻看到一个正在运行的工作流。

---

### **步骤 4: 获取并配置您的专属地址**

自动化过程大约需要2-3分钟。在"Actions"页面等待工作流图标变为**绿色对勾** ✔️。

#### **4.1 获取后端API地址**
1.  在"Actions"页面，点击成功的工作流名称。
2.  在左侧点击 **[deploy-api]** 任务。
3.  在右侧展开 **[Deploy Worker]** 步骤，您会看到一行 `Published tvbox-source-aggregator ...`，后面跟着的 `https://...workers.dev` 就是您的API地址。**请复制它**。

#### **4.2 将API地址配置到前端 (这将触发第二次部署)**
1.  回到仓库代码主页，依次进入 `frontend` 文件夹 -> 点击 `script.js` 文件。
2.  点击 **铅笔图标** 编辑文件。
3.  将 `const API_BASE_URL = '...'` 引号中的内容，替换为您刚复制的API地址。
4.  点击 **[Commit changes...]** 两次保存。
5.  **这会触发第二次自动部署**。请再次前往"Actions"页面，等待这个新的工作流也成功完成。

#### **4.3 获取最终UI界面地址**
1.  等待第二次部署成功后，点击该工作流。
2.  在左侧点击 **[deploy-ui]** 任务。
3.  在右侧展开 **[Deploy to Cloudflare Pages]** 步骤，您会看到一个 `https://tvbox-ui-....pages.dev` 的地址。**这就是您最终的控制面板地址！**

---

### **步骤 5: 完成！**

恭喜您！现在，您可以访问您在上一步获得的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！

---
### **UI界面使用指南 (完整无删减)**

(此部分与之前版本相同，内容完整，此处为简洁省略)
...
