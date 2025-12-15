# GitHub 上传说明

## 如果网络连接持续有问题，请尝试以下步骤：

### 1. 使用 GitHub Desktop（推荐）
- 下载 GitHub Desktop: https://desktop.github.com/
- 添加本地仓库: `C:\personal\AIWeb\SocialSecurityCalculation\social-security-calculator`
- Publish repository 到 GitHub

### 2. 使用个人访问令牌
1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 选择权限: repo (完整访问权限)
4. 复制生成的令牌
5. 使用以下命令:
   ```bash
   git remote set-url origin https://您的用户名:令牌@github.com/chisky/social-security-calculator.git
   git push -u origin main
   ```

### 3. 手动上传
1. 将项目文件夹压缩成 ZIP
2. 访问 GitHub 仓库
3. 点击 "Add file" → "Upload files"
4. 拖拽上传 ZIP 文件

## 当前状态
✅ 代码已提交到本地 Git 仓库（Commit ID: ed15102）
✅ 远程仓库已配置
❌ 网络连接问题导致无法推送到远程

项目文件列表：
- 23 个文件
- 3792 行代码
- 包含完整的前端应用和配置文件