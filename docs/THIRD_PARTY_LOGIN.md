# 第三方登录对接说明（Firebase 三方登录）

## 当前对接接口

- **Base URL**：`https://api.ipod.vip:3303/facial`
- **登录接口**：`POST /app/user/snsThreePartyLogin`（后端校验 **Firebase ID Token**）

## 前端流程（Firebase）

- **Apple**：Apple Sign In → Firebase `AppleAuthProvider.credential` → `signInWithCredential` → 取 **Firebase idToken** → `snsThreePartyLogin(idToken, loginFrom: 6)`。
- **Google**：Google Sign In → Firebase `GoogleAuthProvider.credential` → `signInWithCredential` → 取 **Firebase idToken** → `snsThreePartyLogin(idToken, loginFrom: 5)`。
- **Facebook（Meta）**：Facebook SDK Login → Firebase `FacebookAuthProvider.credential` → `signInWithCredential` → 取 **Firebase idToken** → `snsThreePartyLogin(idToken, loginFrom: 7)`。
- **Instagram（Meta）**：从后端获取 OAuth 授权页 URL，在 WebView 中打开；授权完成后后端重定向到应用并带上 **Firebase idToken**，前端用 `token` + `loginFrom` 再调同一登录接口。
- **X（Twitter）**：优先走 **OAuth 2.0 PKCE**（系统浏览器）：前端生成 `code_verifier`/`code_challenge`/`state`，向后端要授权 URL，用 `Linking.openURL` 打开；授权后 X 重定向到 `imageai://auth/x?code=xxx&state=xxx`，前端带 `code` + `code_verifier` 调后端兑换接口。若后端未支持 PKCE 或请求失败，自动回退到 WebView OAuth（与 Instagram 相同，回调带 `token=idToken`）。
- **TikTok**：优先走 OpenSDK（原生）拿 `authCode`（Android 还会有 `codeVerifier`）并向后端兑换；若失败自动回退到 OAuth WebView 流程。

## 后端接口约定（已对接）

### Firebase 三方登录

```
POST /facial/app/user/snsThreePartyLogin
Content-Type: application/json

Body:
{
  "idToken": "Firebase ID Token 或各端拿到的 idToken/identityToken",
  "loginFrom": 5 | 6 | 7 | 8 | 9
}

loginFrom：5=Google, 6=Apple, 7=Meta, 8=Twitter(X), 9=TikTok
```

响应需包含 `token`（app JWT）和 `user`（用户信息）。若后端统一用 `{ data: { token, user } }` 包裹，前端已按此解析。

### Meta / X / TikTok 的 OAuth 回调

若提供授权页 URL 接口（如 `GET /auth/social/authorize-url?provider=instagram|x|tiktok`），授权完成后请重定向到应用：

- **Instagram（Meta）**：`imageai://auth/instagram?token=xxx`（token 为 Firebase idToken）
- **X（Twitter）**：
  - **PKCE 流程**：重定向到 `imageai://auth/x?code=xxx&state=xxx`（前端会带 code + code_verifier 调兑换接口）
  - **WebView 流程**：重定向到 `imageai://auth/x?token=xxx`（token 为 Firebase idToken）
- **TikTok**：`imageai://auth/tiktok?token=xxx`

（需在 iOS / Android 配置 URL Scheme `imageai`）

### X（Twitter）OAuth 2.0 PKCE 接口（可选，用于“原生”系统浏览器登录）

若后端支持 X 的 OAuth 2.0 PKCE，可实现以下接口，前端会优先走 PKCE（系统浏览器），否则回退 WebView。

1. **获取授权 URL**（扩展现有接口）  
   `GET /auth/social/authorize-url?provider=x&code_challenge=xxx&state=xxx&redirect_uri=imageai://auth/x`  
   返回 `{ url: "https://twitter.com/i/oauth2/authorize?..." }`，其中 URL 需包含 `response_type=code`、`code_challenge`、`code_challenge_method=S256`、`state`、`redirect_uri` 等。

2. **用授权码兑换登录凭证**  
   `POST /auth/social/x/code-exchange`  
   Body: `{ code, code_verifier, state, redirect_uri? }`  
   后端用 `code` + `code_verifier` 向 X 换 access token，再拉用户信息；返回以下其一即可：
   - `{ token, user }` 或 `{ token, userProfile }`（直接登录）
   - `{ idToken }`（前端再调 `snsThreePartyLogin(idToken, loginFrom: 8)`）

## 环境与配置

### Firebase（必配）

1. 在 [Firebase Console](https://console.firebase.google.com/) 创建项目，并启用 **Authentication** 中的 **Apple**、**Google** 登录方式。
2. **iOS**：下载 `GoogleService-Info.plist`，放入 `ios/YourApp/` 并在 Xcode 中加入工程。
3. **Android**：下载 `google-services.json`，放入 `android/app/`。
4. 执行 `cd ios && pod install` 后重新编译。

### Google 登录

1. 将 **Web 客户端 ID**（Firebase 项目 `google-services.json` / `GoogleService-Info.plist` 中 `client_type: 3` 的 `client_id`，或 Google Cloud OAuth 客户端）配置到：
   - 环境变量 `GOOGLE_WEB_CLIENT_ID=xxx`，或
   - `src/api/config.ts` 中 `authConfig.googleWebClientId`。
2. iOS：在 Xcode 的 URL Types 中配置反向客户端 ID（与 plist 中一致）。

### Facebook 登录（react-native-fbsdk-next）

1. 在 [Meta for Developers](https://developers.facebook.com/) 创建 App，拿到：
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_CLIENT_TOKEN`
2. 在 Firebase Console 的 Authentication 中启用 **Facebook** 登录，并填入 Facebook App ID / App Secret。
3. 前端配置：
   - iOS `Info.plist`：
     - `FacebookAppID`
     - `FacebookClientToken`
     - `CFBundleURLSchemes` 增加 `fb<FACEBOOK_APP_ID>`
   - Android `android/app/src/main/res/values/strings.xml`：
     - `facebook_app_id`
     - `facebook_client_token`
     - `fb_login_protocol_scheme=fb<FACEBOOK_APP_ID>`
   - Android `AndroidManifest.xml`：
     - `com.facebook.sdk.ApplicationId`
     - `com.facebook.sdk.ClientToken`
     - `FacebookActivity` / `CustomTabActivity` / `FacebookContentProvider`
4. iOS 执行 `cd ios && bundle exec pod install` 后重新编译。

### Apple 登录

1. 仅 iOS：在 Xcode 中为 Target 勾选 **Sign in with Apple** capability。
2. 后端使用 **Firebase Admin** 校验前端传来的 **Firebase ID Token** 并返回你们的 token。

### Instagram / X / TikTok

1. 在后端实现 OAuth 流程：生成授权 URL、处理回调、用 `code` 换 access token、用 token 拉用户信息。
2. **X**：若支持 PKCE，在 X 开发者平台配置 Callback URL 为 `imageai://auth/x`（或与前端 `authConfig.xRedirectUri` 一致）；并实现 `GET /auth/social/authorize-url?provider=x&code_challenge=...&state=...&redirect_uri=...` 与 `POST /auth/social/x/code-exchange`（见上文）。**详细步骤（含 X 平台与 App 内 Callback/URL Scheme）见 [X 登录配置流程](./X_LOGIN_CONFIG.md)。**
3. TikTok OpenSDK 需额外提供 `POST /auth/social/tiktok/sdk-exchange`，入参建议：
   - `authCode`（必传）
   - `codeVerifier`（Android 建议传）
   - `redirectUri`（与 TikTok 开发者平台配置一致）
   返回可为：
   - 直接登录结果 `token + user/userProfile`，或
   - `idToken`（前端再走 `/app/user/snsThreePartyLogin`，`loginFrom=9`）
4. 回调页重定向到 `imageai://auth/instagram?token=xxx`、`imageai://auth/x?token=xxx` 或 `imageai://auth/tiktok?token=xxx`。
5. 在 iOS（Info.plist）和 Android（intent-filter）中注册 URL Scheme `imageai`。

## 本地运行

- iOS：`cd ios && pod install` 后再运行（Apple / Google 依赖原生模块）。
- 未配置 `GOOGLE_WEB_CLIENT_ID` 时，Google 登录会提示“请先配置”；Apple 在非 iOS 上会提示“当前平台暂不支持”。
