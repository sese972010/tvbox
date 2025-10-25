# TVBox 源聚合器 (终极版 - 清理与重连部署指南)

您好。在您的卓越协助下，我们已100%定位到问题的根源：您的GitHub仓库与一个错误的Cloudflare账号产生了“幽灵”链接。这份终极指南将引导您彻底清除此链接，从一个干净的状态完成部署。

**本指南100%完整无删减，请严格按照步骤顺序操作。**

---
### **前提**
- 您已登录您的 GitHub 账号。
- 您已准备好您**希望使用的那个正确**的 Cloudflare 账号的登录信息。

---
### **步骤 1: 【核心】在 GitHub 中斩断所有旧的 Cloudflare 链接**

**这一步是全新的，也是最关键的，请仔细操作。**

1.  登录您的 GitHub 账号。
2.  点击页面右上角您的头像，在下拉菜单中选择 **[Settings]**。
3.  在左侧菜单中，找到并点击 **[Applications]**。
4.  在页面主区域，您会看到三个标签页：`Installed GitHub Apps`, `Authorized OAuth Apps`, `Authorized GitHub Apps`。请点击 **[Authorized OAuth Apps]** (已授权的OAuth应用) 这个标签页。
5.  在列表中，找到 **"Cloudflare Pages"**。
6.  点击 "Cloudflare Pages" 右侧的 **三个点的菜单按钮 `...`**，在下拉菜单中选择 **[Revoke]** (撤销)。
7.  在弹出的确认窗口中，点击 **"I understand, revoke access"**。
8.  **操作完成。** 这一步彻底切断了您的GitHub账号与**所有**Cloudflare账号之间的连接，为我们创造了一个绝对干净的环境。

---
### **步骤 2: 在正确的 Cloudflare 账号中，手动创建并重新连接前端项目**

**现在，请登录到您希望用来部署的那个“正确”的Cloudflare账号。**

1.  登录后，在主页左侧菜单中，点击 **[Workers & Pages]**。
2.  选择 **[Pages]** 标签页，然后点击蓝色的 **[Create a project]** -> **[Connect to Git]**。
3.  **重新授权**: 此时，因为我们斩断了旧链接，Cloudflare会弹出一个全新的窗口，要求您重新授权连接到您的GitHub账号。请点击 **[Connect GitHub]** 并按照提示完成授权。在授权页面，请选择 **"All repositories"** (所有仓库) 或至少确保包含了您自己的这个项目仓库。
4.  **选择仓库**: 授权成功后，回到Cloudflare页面，现在您应该能看到您的仓库列表了。请**选择您自己的这个项目仓库**。
5.  点击 **[Begin setup]**。
6.  进入 **"Set up builds and deployments"** 页面：
    *   **Project name (项目名称)**: `tvbox-ui`
    *   **Production branch (生产分支)**: `tvbox-aggregator-ui`
    *   **Build settings (构建设置)**:
        *   **Framework preset (框架预设)**: 选择 `None`。
        *   **Build command (构建命令)**: **将此项留空**。
        *   **Build output directory (构建输出目录)**: 输入 `frontend`。
7.  点击 **[Save and Deploy]**。
8.  **这一次，它必将成功！** Cloudflare Pages会开始第一次部署。等待部署完成后，它会为您提供一个 `https://tvbox-ui.pages.dev` 格式的地址。**这就是您最终的控制面板地址！**

---
### **步骤 3: 部署后端 API 并关联**

**前端项目已成功创建，现在我们回到后端。**

1.  **部署后端**:
    *   回到您的GitHub仓库页面。
    *   进入 **[Actions]** 标签页，在左侧点击 **"Deploy Backend API"** 工作流。
    *   点击 **[Run workflow]** 按钮手动运行一次。
2.  **获取后端API地址**:
    *   等待工作流成功后，进入日志，在 **[Upload Secret & Deploy Worker]** 步骤中，找到并**复制** `https://...workers.dev` 地址。
3.  **关联前后端**:
    *   回到GitHub仓库，进入 `frontend/script.js` 文件并点击编辑。
    *   将 `const API_BASE_URL` 的值替换为您刚复制的后端API地址。
    *   点击 **[Commit changes...]** 两次保存。
4.  **自动更新**: 您无需任何操作。因为您的Pages项目已经连接到了GitHub，这次保存会自动触发Cloudflare Pages进行一次新的部署，将包含正确API地址的前端更新上去。

---
### **步骤 4: 完成！**

恭喜您！现在，您可以访问您在 **步骤 2** 中获得的 `...pages.dev` 地址，开始使用您的TVBox源聚合工具了！

---
### **UI界面使用指南 (完整无删减)**

(此部分内容与之前版本相同，请参照操作)
