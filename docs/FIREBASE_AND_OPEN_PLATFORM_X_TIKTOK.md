# X（Twitter）、TikTok：Firebase 控制台与开放平台建应用步骤

本文说明：

- **Firebase 控制台**里与 X、TikTok 相关的配置（能配什么、不能配什么）。
- **X Developer**、**TikTok for Developers** 上**创建应用 / 拿密钥**的通用步骤（界面名称可能随平台改版略有差异，以官网为准）。

与本项目前端的关系简要说明：

- **Apple / Google**：直接走 Firebase 客户端 SDK，Firebase 里必须启用对应提供商。
- **X**：Firebase 提供内置的 **Twitter** 登录方式（OAuth 1.0a，使用 API Key / API Secret），常用于 **Web 托管页**或 **Firebase 文档里的 Twitter 登录**。本 App 若还使用 **OAuth 2.0 PKCE + 后端**（见 [X_LOGIN_CONFIG.md](./X_LOGIN_CONFIG.md)），则 **X 开发者平台**里还要单独配置 **OAuth 2.0 Client ID** 与 **Callback**，与 Firebase 里填的回调不是同一套参数，但可同属一个 X 应用。
- **TikTok**：Firebase **没有**「TikTok」一键开关；登录依赖 **TikTok 开放平台 + 后端**（见 [TIKTOK_LOGIN_CONFIG.md](./TIKTOK_LOGIN_CONFIG.md)）。Firebase 侧主要是 **项目 + 后端校验 idToken**（Firebase Admin），而不是在控制台勾选 TikTok。

---

## 一、Firebase 控制台：X / Twitter

### 1.1 适用场景

在 Firebase 里启用 **Twitter**，用于：

- 使用 **Firebase Authentication** 官方文档中的 **Twitter 登录**（例如网页 `signInWithPopup` / 重定向，或部分原生封装仍走 Firebase 提供的 Twitter 凭证流程）。
- 你在 **Firebase Hosting** 或自有页面里用 Firebase JS SDK 调起 Twitter，且回调走 **`https://<项目ID>.firebaseapp.com/__/auth/handler`**。

### 1.2 操作步骤（Firebase）

1. 打开 [Firebase Console](https://console.firebase.google.com/)，选中你的项目。
2. 左侧进入 **Build（构建）→ Authentication（身份验证）**。
3. 打开 **Sign-in method（登录方法）** 标签页。
4. 在提供商列表中找到 **Twitter**（控制台可能仍显示为 Twitter，即 X 前身），点击进入。
5. 打开 **Enable（启用）**。
6. 填入两项（来自 X 开发者平台，见下文 **第二节**）：
   - **API Key**（对应 Twitter / X 应用里的 **Consumer Key**，有时也叫 API Key）。
   - **API Secret**（对应 **Consumer Secret**，有时也叫 API Secret）。
7. 保存后，Firebase 会显示 **授权回调 URL（Authorized redirect URI）**，形态一般为：

   ```text
   https://<你的Firebase项目ID>.firebaseapp.com/__/auth/handler
   ```

   若使用了自定义域名，以控制台实际展示的为准。

8. 将上述 **完整回调 URL** 复制到 **X 开发者平台**该应用的 **Callback URL / Redirect URI** 列表中（见 **第二节**），否则 Firebase 托管的 Twitter 登录在授权后会回调失败。

### 1.3 与本项目「移动端 PKCE / 深链」的关系

- 本应用内 **PKCE** 使用的 `redirect_uri` 常为 **`imageai://auth/x`**，这是在 **X 的 OAuth 2.0 设置**里配置的，**不是**上面 Firebase 的 `firebaseapp.com/__/auth/handler`。
- 结论：**同一套业务里可能同时存在两种回调**  
  - 给 **Firebase Twitter 网页流程** → `https://xxx.firebaseapp.com/__/auth/handler`  
  - 给 **App 深链** → `imageai://auth/x`  
  只要在 X 开发者平台 **Callback URL 列表**里**分别添加**即可（X 允许多个 Callback，有数量上限）。

---

## 二、X（Twitter）开放平台：创建应用并拿到密钥

以下以 [X Developer Portal](https://developer.x.com/) / [developer.twitter.com](https://developer.twitter.com/) 常见流程为准。

### 2.1 账号与入口

1. 使用 X 账号登录 **X Developer**。
2. 若首次使用，按向导申请 **Developer** 访问权限（选择用途、描述项目等），等待通过。
3. 进入 **Developer Portal** → **Projects & Apps**（或 **Your Apps**）。

### 2.2 创建 Project / App

1. **Create Project**（或新建默认工程），填写项目名称与用途说明。
2. 在该 Project 下 **Create App**（或添加环境 **Development / Production**），填写应用名称等。
3. 创建完成后进入该 **App** 的设置页。

### 2.3 拿到 Firebase「Twitter」要用的 Key / Secret（OAuth 1.0a）

1. 打开 **Keys and tokens**（或 **Consumer Keys**）。
2. 找到 **API Key and Secret**（历史名称：**Consumer Key / Consumer Secret**）。
3. **Regenerate** 会轮换密钥，轮换后需在 Firebase 里同步更新。

将 **API Key**、**API Secret** 填入 Firebase **Authentication → Twitter** 配置（见 **第一节**）。

### 2.4 配置 Callback（Firebase 回调）

1. 进入 **User authentication settings**（或 App 的 **Authentication** / **Callback URLs**）。
2. 在 **Callback URI / Redirect URL** 中添加 Firebase 控制台给出的地址，例如：

   `https://<项目ID>.firebaseapp.com/__/auth/handler`

3. 保存。

### 2.5 若使用 OAuth 2.0（本 App PKCE / 后端）

1. 在同一应用设置中启用 **OAuth 2.0**（若控制台提供 **OAuth 2.0 Client ID**）。
2. 记录 **Client ID**（及若需要的 **Client Secret**）给**后端**生成授权 URL。
3. 在 **Callback** 列表中再添加 **`imageai://auth/x`**（与 [X_LOGIN_CONFIG.md](./X_LOGIN_CONFIG.md) 一致）。

---

## 三、Firebase 控制台：TikTok

### 3.1 重要说明

在 **Authentication → 登录方法** 的标准列表中，**没有「TikTok」提供商**（与 Google、Facebook、Twitter 不同）。因此：

- **不需要**、也**无法**像 Twitter 那样在 Firebase 里「启用 TikTok 并填一对 Key」完成全部登录。
- 本项目做法是：**TikTok 开放平台** → App 内 **OpenSDK** 或 **WebView** → **后端** `sdk-exchange` / OAuth → 返回 **Firebase ID Token**（或你们约定的 token）→ 再调 **`snsThreePartyLogin`**（见 [THIRD_PARTY_LOGIN.md](./THIRD_PARTY_LOGIN.md)）。

### 3.2 Firebase 侧通常仍要做的事

1. **同一个 Firebase 项目**  
   保证 iOS `GoogleService-Info.plist`、Android `google-services.json` 来自该项目（与 Apple/Google 一致）。

2. **后端校验 Token**  
   若后端用 **Firebase Admin SDK** 校验 `idToken` 或签发 **自定义登录**，需在 Firebase **Project settings → Service accounts** 生成私钥，由后端安全保存；若使用 **Custom Token** 流程，在 **Authentication → Sign-in method** 中启用 **自定义身份验证（Custom）**（按你们后端实际方案）。

3. **不要在控制台找「TikTok」开关**  
   TikTok 权限、回调、Client Key 均在 **TikTok for Developers** 配置（见 **第四节**）。

---

## 四、TikTok 开放平台：创建应用并配置登录

以下以 [TikTok for Developers](https://developers.tiktok.com/) 常见流程为准。

### 4.1 登录与创建应用

1. 使用 TikTok 账号登录 [TikTok for Developers](https://developers.tiktok.com/)。
2. 进入 **Developer Portal** / **Console**。
3. 选择 **Register** / **Create an app**（创建应用）。
4. 填写应用名称、描述、**应用图标**、**类别**、**使用场景**等（按表单要求）。
5. 提交后等待审核（若当前政策要求审核）；通过后进入应用详情。

### 4.2 开通 Login Kit（登录）

1. 在应用详情中找到 **Products** / **Add products**。
2. 添加 **Login Kit**（名称可能为 **Login Kit for Web / iOS / Android**，按端勾选）。
3. 按提示补全 **隐私政策 URL**、**服务条款 URL**、**平台信息**（iOS Bundle ID、Android 包名、签名证书指纹等，以控制台要求为准）。

### 4.3 Redirect URI（与 OpenSDK / 后端一致）

1. 在 Login Kit 或 **Credentials** 相关页面找到 **Redirect URI** / **Callback URL**。
2. 添加你们的 **HTTPS** 地址（TikTok 通常要求 **HTTPS**，且与线上一致），须与：

   - 前端环境变量 **`TIKTOK_OPENSDK_REDIRECT_URI`**（见 `authConfig.tiktokOpenSdkRedirectUri`），  
   - 后端 **`POST /auth/social/tiktok/sdk-exchange`** 请求体里的 **`redirectUri`**  

   **完全一致**。

3. 保存。

### 4.4 获取 Client Key

1. 在应用 **Credentials** / **Basic information** 中查看 **Client Key**（部分文档也称 Client Key，与 iOS `Info.plist` 的 **`TikTokClientKey`**、URL Scheme 一致）。
2. 将工程中的占位符 **`YOUR_TIKTOK_CLIENT_KEY`** 全部替换为真实值（iOS `Info.plist`、Android `AndroidManifest.xml`），详见 [TIKTOK_LOGIN_CONFIG.md](./TIKTOK_LOGIN_CONFIG.md)。

### 4.5 测试与上架

1. 使用控制台提供的 **Sandbox / 测试用户**（若有）在开发环境验证。
2. 提交应用审核（若 Login Kit 要求），通过后再用生产环境 Client Key 与 Redirect URI。

---

## 五、文档索引

| 主题 | 文档 |
|------|------|
| X 深链、`imageai://auth/x`、PKCE、WebView、`X_AUTHORIZE_URL` | [X_LOGIN_CONFIG.md](./X_LOGIN_CONFIG.md) |
| TikTok Client Key、Redirect、`sdk-exchange`、WebView 回退 | [TIKTOK_LOGIN_CONFIG.md](./TIKTOK_LOGIN_CONFIG.md) |
| 全链路接口与 `loginFrom` | [THIRD_PARTY_LOGIN.md](./THIRD_PARTY_LOGIN.md) |

若你希望把 **Firebase 里 Twitter 回调 URL** 与 **后端实际域名** 做成一页对照表（多环境），可以说明环境名，我可以帮你在上述文档中加一节「多环境 Callback 列表模板」。
