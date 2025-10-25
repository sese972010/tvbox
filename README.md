# TVBox 源聚合器 (终极版 - 密钥配置与部署指南)

您好！本指南将以终极的、无删减的细节，指导您完成部署。我们已经成功触发了工作流，现在只需精确配置好密钥，即可大功告成。

**本指南完整无删减，请严格按照步骤顺序操作。**

---
### **前提**
- 您已登录您的 GitHub 账号和 Cloudflare 账号。

---

### **步骤 1: 从 Cloudflare 获取部署所需信息**

*(此部分与之前版本相同，请确保您已准备好 Account ID 和 API Token)*

1.  **获取 Account ID**: 登录 Cloudflare, 进入任意网站管理页面，在右侧边栏的 "API" 区域下方，复制您的 "Account ID"。
2.  **创建 API Token**: 在 Cloudflare 的 "My Profile" -> "API Tokens" 页面，使用 "Edit Cloudflare Workers" 模板创建一个新的 Token 并复制。

---

### **步骤 2: 【核心】精确地配置三个必需的密钥**

**请仔细、缓慢地按照以下每一步操作。一个微小的错误都可能导致失败。**

1.  **进入正确的页面**:
    *   在您的 GitHub 仓库主页，点击顶部的 **[Settings]** 标签页。
    *   在左侧菜单中，依次点击 **[Secrets and variables]** -> **[Actions]**。

2.  **定位到正确的区域**:
    *   您会看到页面上有 **[Secrets]** 和 **[Variables]** 两个并排的标签页。
    *   **请确保您正处于 [Secrets] 标签页下** (它应该有下划线，表示当前选中)。
    *   您会看到一个标题为 **"Repository secrets"** (仓库密钥)。**我们的所有操作都在这个标题下方进行。**

3.  **(可选但建议) 删除旧的密钥**:
    *   如果您之前创建过 `GH_TOKEN` 或 `GITHUB_TOKEN`，请在列表中找到它，点击它右侧的 **[Update]** 按钮旁边的下拉箭头，选择 **[Remove secret]** 并确认删除。确保环境干净。

4.  **逐一创建三个密钥**:
    *   点击 **"Repository secrets"** 标题右侧的绿色按钮 **[New repository secret]**。

    *   **密钥一：Cloudflare Account ID**
        *   **Name (名称)**: 请**完整复制**下面的名称，然后粘贴进去，不要手动输入：
          `CLOUDFLARE_ACCOUNT_ID`
        *   **Secret (密钥内容)**: 粘贴您在 **步骤 1** 中获取的 **Account ID**。
        *   点击 **[Add secret]** (添加密钥)。

    *   **密钥二：Cloudflare API Token**
        *   再次点击绿色的 **[New repository secret]** 按钮。
        *   **Name (名称)**: 请**完整复制**下面的名称，然后粘贴进去：
          `CLOUDFLARE_API_TOKEN`
        *   **Secret (密钥内容)**: 粘贴您在 **步骤 1** 中创建的 **API Token**。
        *   点击 **[Add secret]**。

    *   **密钥三：GitHub Token**
        *   第三次点击绿色的 **[New repository secret]** 按钮。
        *   **Name (名称)**: 请**完整复制**下面的名称，然后粘贴进去：
          `GH_TOKEN`
        *   **Secret (密钥内容)**: (请按照之前的详细说明，创建一个新的GitHub Token并粘贴在这里)。
        *   点击 **[Add secret]**。

---

### **密钥常见问题排查 (请务必阅读)**
*   **问题：`Value for secret ... not found` (找不到密钥值)**
    *   **原因1：名称拼写错误。** `GH_TOKEN` 和 `GH-TOKEN` 是不同的。请务必使用**复制粘贴**的方式填写名称，不要手动输入。
    *   **原因2：存错了地方。** 您是否不小心在 **[Variables]** 标签页下创建了密钥？请确保您的三个密钥都显示在 **[Secrets]** 标签页的 **"Repository secrets"** 列表中。
    *   **原因3：包含了多余的空格。** 复制密钥内容时，请确保没有选中前后多余的空格。

---

### **步骤 3: 手动触发部署**

**在您确认三个密钥都已在正确的位置、使用正确的名称创建后**，我们来手动触发部署。

1.  点击页面顶部的 **[Actions]** 标签页。
2.  在左侧的 "All workflows" 列表中，点击 **"Deploy to Cloudflare"** 工作流。
3.  在右侧，点击蓝色的 **[Run workflow]** 按钮，在弹出的窗口中再次点击绿色的 **[Run workflow]** 按钮。
4.  **部署已强制开始！** 您会立刻看到一个新的工作流开始运行。这一次，它应该能成功获取所有密钥，并顺利完成。

---

### **后续步骤 (获取地址、UI使用等)**

(后续所有步骤，包括获取API地址、配置前端、获取最终UI地址和UI界面使用指南，都与之前完全相同，此处不再重复。)
