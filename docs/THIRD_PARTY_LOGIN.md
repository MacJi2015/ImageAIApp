# 第三方登录对接说明（Firebase 三方登录）

## 当前对接接口

- **Base URL**：`https://api.ipod.vip:3303/facial`
- **登录接口**：`POST /app/user/snsThreePartyLogin`（后端校验 **Firebase ID Token**）

## 前端流程（Firebase）

- **Apple**：Apple Sign In → Firebase `AppleAuthProvider.credential` → `signInWithCredential` → 取 **Firebase idToken** → `snsThreePartyLogin(idToken, loginFrom: 6)`。
- **Google**：Google Sign In → Firebase `GoogleAuthProvider.credential` → `signInWithCredential` → 取 **Firebase idToken** → `snsThreePartyLogin(idToken, loginFrom: 5)`。
- **Instagram（Meta） / X（Twitter）**：从后端获取 OAuth 授权页 URL，在 WebView 中打开；授权完成后后端重定向到应用并带上 **Firebase idToken**，前端用 `token` + `loginFrom` 再调同一登录接口。

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

### Meta / X 的 OAuth 回调

若提供授权页 URL 接口（如 `GET /auth/social/authorize-url?provider=instagram|x`），授权完成后请重定向到应用并携带 **idToken**（如 Firebase 侧换好的 token）：

- **Instagram（Meta）**：`imageai://auth/instagram?token=xxx`
- **X（Twitter）**：`imageai://auth/x?token=xxx`

（需在 iOS / Android 配置 URL Scheme `imageai`）

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

### Apple 登录

1. 仅 iOS：在 Xcode 中为 Target 勾选 **Sign in with Apple** capability。
2. 后端使用 **Firebase Admin** 校验前端传来的 **Firebase ID Token** 并返回你们的 token。

### Instagram / X

1. 在后端实现 OAuth 流程：生成授权 URL、处理回调、用 `code` 换 access token、用 token 拉用户信息。
2. 回调页重定向到 `imageai://auth/instagram?code=xxx` 或 `imageai://auth/x?code=xxx`。
3. 在 iOS（Info.plist）和 Android（intent-filter）中注册 URL Scheme `imageai`。

## 本地运行

- iOS：`cd ios && pod install` 后再运行（Apple / Google 依赖原生模块）。
- 未配置 `GOOGLE_WEB_CLIENT_ID` 时，Google 登录会提示“请先配置”；Apple 在非 iOS 上会提示“当前平台暂不支持”。
