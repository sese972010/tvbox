# TVBox 源聚合器 (终极图形化部署指南)

这是一个全自动的TVBox源查找、测试、合并和部署工具。您无需接触任何命令行，只需在网页上进行一系列点击操作，即可拥有一个为您持续更新高质量TVBox源的专属订阅地址。

---

## 全图形化部署指南 (无需命令行)

请严格按照以下步骤操作。**每一步都非常重要，请勿跳过。**

### 准备工作
- **一个 GitHub 账号** (并已登录)。
- **一个 Cloudflare 账号** (并已登录)。

---

### 步骤 1: 将项目复刻 (Fork) 到您的账号

1.  在当前项目页面的右上角，找到并点击 **[Fork]** 按钮。
2.  在弹出的新页面中，通常您不需要修改任何设置。直接点击绿色的 **[Create fork]** 按钮。
3.  等待几秒钟，页面会自动跳转到您自己的仓库。URL会变成 `https://github.com/您的用户名/tvbox` 的格式。**后续所有GitHub操作都在这个您自己的仓库里进行。**

---

### 步骤 2: 从 Cloudflare 获取部署所需信息

**在新浏览器标签页中打开Cloudflare官网并登录。**

#### 2.1 获取 Account ID
1.  登录后，在Cloudflare主页的右侧菜单下方，您可以看到 **Account ID**。
2.  点击它旁边的**复制图标**，将这串ID字符保存到记事本里。

#### 2.2 创建 API Token
1.  在Cloudflare主页，点击右侧的 **[My Profile]** -> **[API Tokens]**。
2.  点击蓝色的 **[Create Token]** 按钮。
3.  在列表中找到 **"Edit Cloudflare Workers"** 模板，点击它右侧的 **[Use template]** 按钮。
4.  在新页面中，所有设置保持默认即可。直接滚动到页面最底部，点击 **[Continue to summary]**。
5.  点击 **[Create Token]**。
6.  页面会生成一长串字符，这就是您的API Token。**请立即点击[Copy]按钮复制并妥善保管。这个Token只会完整显示这一次，关闭页面后将无法找回。**

---

### 步骤 3: 在 GitHub 仓库中配置三个必需的密钥

**回到您在步骤1中创建的GitHub仓库页面。**

1.  点击页面顶部的 **[Settings]** 标签页。
2.  在左侧菜单中，依次点击 **[Secrets and variables]** -> **[Actions]**。
3.  在页面主区域，点击绿色的 **[New repository secret]** 按钮，我们来逐一添加三个密钥。

    -   **密钥一：Cloudflare Account ID**
        -   **Name**: `CLOUDFLARE_ACCOUNT_ID` (请务必精确复制)
        -   **Secret**: 粘贴您在 **步骤 2.1** 中获取的 **Account ID**。
        -   点击 **[Add secret]**。

    -   **密钥二：Cloudflare API Token**
        -   再次点击 **[New repository secret]**。
        -   **Name**: `CLOUDFLARE_API_TOKEN`
        -   **Secret**: 粘贴您在 **步骤 2.2** 中创建的 **API Token**。
        -   点击 **[Add secret]**。

    -   **密钥三：GitHub Token**
        -   [**点击这里**](https://github.com/settings/tokens/new) 在新标签页中创建一个GitHub自身的Token。
        -   **Note**: 随便填写一个名字，如 `tvbox`。
        -   **Expiration**: 强烈建议选择 **[No expiration]** (永不过期)。
        -   **Select scopes**: 只需勾选 **`public_repo`** 权限即可。
        -   滚动到底部，点击 **[Generate token]**。
        -   **立即复制**生成的Token (同样只会显示一次)。
        -   回到您的仓库Secrets设置页面，第三次点击 **[New repository secret]**。
        -   **Name**: `GITHUB_TOKEN`
        -   **Secret**: 粘贴您刚刚生成的 **GitHub Token**。
        -   点击 **[Add secret]**。

---

### 步骤 4: 【关键】启用并首次触发自动化部署

#### 4.1 启用工作流 (Actions)
1.  在您的仓库页面，点击顶部的 **[Actions]** 标签页。
2.  您会看到一个提示信息，中间有一个很大的绿色按钮。
3.  请点击这个绿色的 **[I understand my workflows, go ahead and enable them]** 按钮。
4.  页面刷新后，会显示 "There are no workflow runs yet."。这代表自动化机器人已待命。

#### 4.2 首次触发
1.  点击顶部菜单的 **[< > Code]** 回到代码主页。
2.  在文件列表中，找到并点击 `README.md` 文件。
3.  在文件内容的右上角，点击 **铅笔图标 (Edit this file)**。
4.  **无需修改任何内容**，直接滚动到页面顶部，点击绿色的 **[Commit changes...]** 按钮。
5.  在弹出的窗口中，再次点击绿色的 **[Commit changes]** 按钮。
6.  **部署已自动开始！** 再次点击顶部的 **[Actions]** 标签页，您应该能看到一个正在运行的工作流了。

---

### **疑难解答：如果Actions没有运行怎么办？**
- **检查分支名称**: 回到仓库代码主页，看一下文件列表上方、您的仓库名称下方，显示的是 **`main`** 还是 **`master`**。本项目的配置文件已同时支持这两种名称，一般不会出问题。
- **检查拼写**: 请务必仔细检查您在步骤3中添加的三个Secret的**Name**是否与文档完全一致，多一个空格或大小写错误都会导致失败。
- **刷新页面**: 有时GitHub页面有延迟，请尝试刷新一下Actions页面。

---

### 步骤 5: 获取并配置您的专属地址

自动化过程大约需要2-3分钟。在"Actions"页面等待工作流图标变为**绿色对勾** ✔️。

#### 5.1 获取后端API地址
1.  在"Actions"页面，点击刚刚成功的工作流名称 (例如 "Deploy to Cloudflare")。
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

恭喜！现在，您可以访问您在上一步获得的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！
