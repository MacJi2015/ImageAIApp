# X（Twitter）登录配置流程

本文说明如何在 **X 开发者平台** 和 **本应用（iOS/Android）** 中配置 Callback URL，使 X OAuth 2.0 PKCE 登录和 WebView 登录的回调能正确唤起应用。

---

## 一、X 开发者平台：配置 Callback URL

### 1. 打开应用设置

1. 登录 [X Developer Platform](https://developer.x.com)（原 Twitter Developer）。
2. 进入 **Developer Console**（开发者控制台）。
3. 在 **Your Apps** 下找到你的应用（如 **imageAIapp**），点击进入。
4. 在应用详情页中，找到 **User authentication settings** 或 **App settings** 相关区域。

### 2. 启用 OAuth 2.0（若尚未启用）

- 若使用 **OAuth 2.0 PKCE**（推荐）或 OAuth 2.0 授权码流程，需在应用里启用 **OAuth 2.0**。
- 在 **User authentication settings** 中点击 **Set up** 或 **Edit**，选择 **OAuth 2.0** 类型。
- 保存后，在 **Keys and tokens** 中会看到 **Client ID**（OAuth 2.0 使用），后端生成授权 URL 时需要该 Client ID。

### 3. 添加 Callback URL / Redirect URI

- 在 **User authentication settings** 或 **App settings** 里找到 **Callback URI / Redirect URI / Callback URL** 的配置（不同界面可能名称略有差异）。
- 点击 **Add** 或 **Edit**，添加以下地址（必须与前端和后端使用的完全一致）：

```text
imageai://auth/x
```

- **说明**：
  - 每个应用最多可配置 **10 个** Callback URL。
  - 授权请求中的 `redirect_uri` 必须与这里配置的 **完全一致**（包括大小写、是否带路径）。
  - 本应用默认使用 `imageai://auth/x`，对应前端 `authConfig.xRedirectUri` 与深链 `imageai://auth/x?code=xxx&state=xxx`。

### 4. 保存

- 保存设置后，X 在用户授权后会重定向到 `imageai://auth/x?code=...&state=...`（PKCE）或由后端重定向到 `imageai://auth/x?token=...`（WebView 流程）。

---

## 二、本应用：配置 URL Scheme / Deep Link

要让系统在打开 `imageai://auth/x?...` 时唤起本应用，需要在 **iOS** 和 **Android** 中注册 `imageai` 协议。

### 1. iOS（Info.plist）

已在 **`ios/ImageAIApp/Info.plist`** 中配置：

- 在 **CFBundleURLTypes** 中增加一项：
  - **CFBundleURLSchemes**：`imageai`
  - **CFBundleURLName**：`OAuth callback`（可选，便于识别）
  - **CFBundleTypeRole**：`Editor`

若你使用 Xcode 图形界面：

1. 打开 `ios/ImageAIApp.xcworkspace`。
2. 选中 Target **ImageAIApp** → **Info** → **URL Types**。
3. 点击 **+** 新增一项：
   - **Identifier**：可填 `OAuth callback` 或任意标识。
   - **URL Schemes**：填 **`imageai`**（不要加 `://`）。
   - **Role**：选 **Editor**。

保存后，当用户通过 Safari 或系统浏览器完成 X 授权并跳转到 `imageai://auth/x?...` 时，系统会唤起本应用。

### 2. Android（AndroidManifest.xml）

已在 **`android/app/src/main/AndroidManifest.xml`** 的 **MainActivity** 中增加：

- 一个 **intent-filter**：
  - **action**：`android.intent.action.VIEW`
  - **category**：`DEFAULT`、`BROWSABLE`
  - **data**：`scheme="imageai"`，`host="auth"`，`pathPrefix="/"`

这样 `imageai://auth/x?code=...&state=...` 或 `imageai://auth/x?token=...` 会由本应用接收。

若你手动检查：

1. 打开 `android/app/src/main/AndroidManifest.xml`。
2. 找到 `<activity android:name=".MainActivity" ...>`。
3. 确认其中除 **MAIN/LAUNCHER** 外，还有上述 **VIEW + imageai** 的 intent-filter。

---

## 三、前后端与 Callback 的对应关系

| 配置项 | 值 | 说明 |
|--------|-----|------|
| X 开发者平台 Callback URL | `imageai://auth/x` | 与下面保持一致 |
| 前端 `authConfig.xRedirectUri` | `imageai://auth/x` | 见 `src/api/config.ts`，可用环境变量 `X_REDIRECT_URI` 覆盖 |
| 后端生成 X 授权 URL 时的 `redirect_uri` | `imageai://auth/x` | 必须与 X 平台配置一致 |
| iOS URL Scheme | `imageai` | 使 `imageai://...` 唤起本应用 |
| Android intent-filter | `imageai` scheme，`auth` host | 同上 |

只要上述几处都使用 **`imageai://auth/x`**，PKCE 与 WebView 两种流程的回调都能正确回到本应用。

---

## 四、不配 `authorize-url`：仅用固定授权页（推荐）

若**不想实现** `GET /auth/social/authorize-url?provider=x`，只要有一个 **https 授权页**（例如 Firebase Hosting + Firebase Auth 的 Twitter 登录页），在用户登录成功后 **重定向到 `imageai://auth/x?token=Firebase_idToken`** 即可。

1. 配置 **`X_AUTHORIZE_URL`**（完整 `https://...`），或在 **`src/api/config.ts`** 的 **`authConfig.xAuthorizeUrl`** 中填写同一地址。  
   **注意**：若项目未用 `react-native-config` 等注入 `.env`，`process.env.X_AUTHORIZE_URL` 可能为空，联调时请**直接改 `config.ts` 默认值**。

2. **当前 App 行为**（已改）：只要配置了 `xAuthorizeUrl`，**不会再请求** `authorize-url`，也**不会先走 PKCE**。  
   - **X 登录的 https 授权页一律用系统浏览器（Safari / Chrome）打开**，不再用应用内 WebView，避免 Firebase `signInWithRedirect` 报 **「missing initial state」**（`sessionStorage` 在 WebView 中不可靠；自建域名 `xAuthorizeUrl` 也同样）。  
   - 授权结束后跳转到 `imageai://auth/x?token=...`，由 App 深链处理并调用 `snsThreePartyLogin(idToken, 8)`。

**不要**把 `xAuthorizeUrl` 设为 `https://<项目>.firebaseapp.com/__/auth/handler`：那是回调端点，不是用户入口。

本仓库提供可部署的起始页 **`firebase-hosting-public/x-twitter-login.html`**（内用 Firebase Twitter `signInWithRedirect`，成功后跳 `imageai://auth/x?token=...`）。部署步骤：

1. 在 `ImageAIApp` 目录执行（无需全局安装 `firebase` 命令）：`yarn firebase:login`（或 `npx firebase-tools@latest login`）。
2. `npx firebase-tools@latest use imageapp-1553c`（或你的项目 ID），然后 `yarn firebase:deploy:hosting`（或 `npx firebase-tools@latest deploy --only hosting`）。  
   若已 `npm i -g firebase-tools` 但仍提示 `command not found`，把 npm 全局 `bin` 加入 PATH，或始终用上面的 `npx` / `yarn` 脚本。
3. 默认 `authConfig.xAuthorizeUrl` 为 **`https://imageapp-1553c.firebaseapp.com/x-twitter-login.html`**（与 `authDomain` 同站，勿用 `*.web.app`，否则 Safari 下 `signInWithRedirect` 易死循环）；若项目 ID 不同，改 `config.ts` 或 `.env` 的 `X_AUTHORIZE_URL`。
4. Firebase 控制台 → Authentication → 设置 → **授权网域**，保留 `imageapp-1553c.firebaseapp.com`（默认会有），并可保留 `imageapp-1553c.web.app`（若别处仍用）。

---

## 五、可选：其他环境变量

若你想使用不同的回调地址（例如多环境），可在 `.env` 中设置：

```bash
# 默认即为 imageai://auth/x，仅在需要与 X 平台其他 URL 区分时修改
X_REDIRECT_URI=imageai://auth/x
```

修改后需同步在 **X 开发者平台** 的 Callback URL 列表中加入该地址，并在 **后端** 使用同一 `redirect_uri` 生成授权链接。

---

## 六、验证

1. **X 平台**：在应用设置中确认 Callback URL 列表里存在 `imageai://auth/x`。
2. **iOS**：用 Safari 或 Notes 输入 `imageai://auth/x?code=test&state=test`，应能唤起本应用（应用内可能因 state 无效而提示失败，属正常）。
3. **Android**：用浏览器或 adb 打开 `imageai://auth/x?code=test&state=test`，应能唤起本应用。

完成以上配置后，X 登录的 PKCE 与 WebView 回调即可正常回到应用内处理。

---

## 七、测试流程：从点击 X 登录到跳回 App

按下面步骤在真机或模拟器上验证「点击 X 登录 → 打开授权页 → 授权后跳回 App 并完成登录」。

### 前置条件

- **后端** 至少已实现 **WebView 流程**：  
  - 提供 `GET /auth/social/authorize-url?provider=x`，返回 X 授权页 URL；  
  - 用户授权后，后端回调页重定向到 **`imageai://auth/x?token=<Firebase_idToken>`**。  
- 若后端已支持 **PKCE**，则会优先走系统浏览器 + `imageai://auth/x?code=xxx&state=xxx`。
- 本应用已配置好 **X 平台 Callback URL** 与 **iOS/Android 的 imageai URL Scheme**（见上文）。

### 测试步骤

1. **安装并打开应用**  
   使用 `npm run ios` 或 `npm run android` 在真机/模拟器上运行（真机更接近真实 OAuth 跳转）。

2. **进入登录入口**  
   在应用内打开登录弹窗（例如需要登录才能使用的功能会弹出 Log In 面板）。

3. **点击「Continue with X」**  
   - **若后端支持 PKCE**：会先请求带 `code_challenge` 的授权 URL；成功则用系统浏览器打开授权页，失败则自动回退到下一步。  
   - **若后端仅支持 WebView**：会直接请求普通授权 URL，并在 **应用内 WebView** 中打开 X 授权页。

4. **在授权页完成 X 登录/授权**  
   - 在浏览器或 WebView 中登录 X 账号并同意授权。

5. **确认跳回 App**  
   - **WebView 流程**：后端重定向到 `imageai://auth/x?token=xxx` 后，WebView 会尝试打开该链接，系统应 **唤起本应用** 并关闭 WebView。  
   - **PKCE 流程**：X 重定向到 `imageai://auth/x?code=xxx&state=xxx`，系统 **唤起本应用**。  
   - 回到 App 后，若一切正常，会完成登录并关闭登录弹窗，可看到已登录状态。

6. **可选：看日志**  
   - 开发模式下若控制台有 `[XLogin]` 相关 log，可确认是走了 PKCE 还是 WebView、以及 code/state 或 token 是否被正确接收。

### 常见问题排查

| 现象 | 可能原因 | 处理建议 |
|------|----------|----------|
| 点击「Continue with X」无反应或报错 | 后端未实现 `GET /auth/social/authorize-url?provider=x` 或接口报错 | 检查网络请求、后端日志；先用 Postman 等调该接口确认返回 URL。 |
| 授权完成后一直停在浏览器/WebView，没有回到 App | 1. 后端未重定向到 `imageai://auth/x?...`<br>2. iOS/Android 未注册 `imageai` URL Scheme | 1. 确认后端回调页最终跳转地址为 `imageai://auth/x?token=xxx` 或 `?code=xxx&state=xxx`。<br>2. 按本文「二」检查 Info.plist / AndroidManifest 的 imageai 配置，重新装包测试。 |
| 回到 App 但未登录 / 提示失败 | 1. `token` 或 `code` 无效/过期<br>2. 后端兑换接口报错 | 查看控制台或后端日志；确认后端用 token 或 code 能正确换到用户并返回 app token。 |
| iOS：Safari 打开 `imageai://auth/x?code=test&state=test` 不唤起 App | URL Types 未生效或 Scheme 填错 | 在 Xcode 中确认 URL Schemes 为 `imageai`（无 `://`），Clean Build 后重新安装。 |
| Android：点击链接不唤起 App | intent-filter 的 scheme/host 与链接不一致 | 确认 Manifest 中为 `scheme="imageai"`、`host="auth"`，链接为 `imageai://auth/x?...`。 |
| **`?diag=1` 里 `createAuthUri` 报 415，但「弹窗登录」成功** | 旧逻辑用**当前页**（`…/x-twitter-login.html`）作 `continueUri` 探测，Twitter 若只登记了 `__/auth/handler` 会误报 | 探测已改为 `https://<authDomain>/__/auth/handler`，与 X 后台应配回调一致；**弹窗与重定向仍以真实按钮为准**。 |
| **系统浏览器**仍提示 **missing initial state** | `xAuthorizeUrl` 填成了 **`__/auth/handler` 回调地址**，或未在同一浏览会话内先执行 `signInWithRedirect` | `xAuthorizeUrl` 必须是**登录起始页**（页面内加载 Firebase 并调用 `signInWithRedirect`），不能是用户直接打开的 handler；勿用收藏夹/外部 App 只打开 handler。 |
| **missing initial state** 且页面像在 **应用内 WebView** 里打开 | iOS 上 `Linking.canOpenURL(https://…)` 曾误为 false，未走系统浏览器而进了 App 内 WebView | 工程已改为对 http(s) **直接 `Linking.openURL`**，并在 `Info.plist` 的 `LSApplicationQueriesSchemes` 中加入 `https`、`http`；请重新编译安装 App。Hosting 页改为**点击按钮**后再 `signInWithRedirect`，勿在 X 内置浏览器里完成全流程（必要时「在 Safari 中打开」）。 |
| Safari 已打开 App，但 **App 内不登录 / 像没收到回调** | iOS `AppDelegate` 未把自定义 URL 交给 React Native `Linking` | 已在 `ios/ImageAIApp/AppDelegate.swift` 的 `application(_:open:options:)` 中发送 **`RCTOpenURLNotification`**（与 `RCTLinkingManager` 一致），使 `imageai://auth/x?token=…` 能到达 JS；请 **Clean + 重装** 后再测。 |
| 点击「使用 X 继续」→ 加载后又回到 **同一按钮**（死循环） | 授权页在 **`*.web.app`**，与 **`authDomain`（`*.firebaseapp.com`）** 跨站，Safari 分区存储导致 `getRedirectResult` 拿不到用户 | 使用 **`https://<项目ID>.firebaseapp.com/x-twitter-login.html`** 作为 `X_AUTHORIZE_URL`（见 `config.ts` 默认）；Hosting 页已支持从 web.app **自动跳转到 firebaseapp.com**。部署后重装 App 再测。 |
| 页面提示 **`auth/api-key-not-valid`** / `please-pass-a-valid-api-key` | 1. `x-twitter-login.html` 里 `apiKey` 与控制台 **Web 应用** 不一致或复制错（易混 `0`/`O`）<br>2. 在 [Google Cloud 控制台 → API 与服务 → 凭据](https://console.cloud.google.com/apis/credentials) 中，该密钥的**应用限制**未包含浏览器来源 | ① Firebase → 项目设置 → **Web 应用 imageAI** → 重新复制整段 `firebaseConfig`，覆盖 HTML 后 `firebase deploy --only hosting`。<br>② 在 **Google Cloud** 打开同项目，找到与 Web 配置同名的 **API 密钥** → **应用限制**选「HTTP 引荐来源网址」，添加：`https://<项目ID>.firebaseapp.com/*`、`https://<项目ID>.web.app/*`（本地可加 `http://localhost:*`）；或为排查暂时选「无」再测。<br>③ **API 限制**须允许 **Identity Toolkit API** 等（或选「不限制 API」配合仅 HTTP 引荐来源限制）。**勿**把 iOS `GoogleService-Info.plist` 里的 `API_KEY` 当网页 `apiKey` 使用（平台不同）。 |

### 快速验证深链是否生效（不依赖后端）

- **iOS**：在 Safari 地址栏输入 `imageai://auth/x?code=test&state=test` 并前往，应唤起本应用（应用内可能因 state 无效而登录失败，属正常）。  
- **Android**：在终端执行  
  `adb shell am start -a android.intent.action.VIEW -d "imageai://auth/x?code=test&state=test"`  
  应唤起本应用。

若上述链接能唤起 App，说明 URL Scheme / 深链配置正确，问题多半在后端回调或 token/code 处理。
