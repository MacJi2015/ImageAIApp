# TikTok 登录配置流程

本文说明如何在 **TikTok 开放平台**、**本应用（iOS/Android）** 与 **后端** 中配置登录，与代码中的 **`loginWithTikTokPreferSdk` → OpenSDK** 及 **WebView OAuth 回退** 一致。

应用内流程简述：

1. **优先**：`react-native-tiktok` 调起 TikTok App / 授权页，拿到 `authCode`（Android 可能还有 `codeVerifier`）→ 请求后端 **`POST /auth/social/tiktok/sdk-exchange`** → 返回 **`idToken`** → 前端再调 **`snsThreePartyLogin(idToken, loginFrom: 9)`**。
2. **回退**：OpenSDK 失败或未配置 `redirect_uri` 时，请求 **`GET /auth/social/authorize-url?provider=tiktok`**，在应用内 WebView 打开；授权结束后后端重定向到 **`imageai://auth/tiktok?token=<Firebase_idToken>`**，同样走 `snsThreePartyLogin(..., 9)`。

---

## 一、TikTok 开放平台（开发者后台）

1. 打开 [TikTok for Developers](https://developers.tiktok.com/) 并登录。
2. 进入 **Console**，创建或选择你的 **应用（Client）**。
3. 找到 **Login Kit**（或「登录」相关产品），按平台开启 **iOS / Android**（与实际上线包一致）。
4. 配置 **Redirect URI / 回调地址**（名称因控制台版本可能为 *Redirect URI*、*Callback URL* 等）：
   - 须与下文 **前端 `TIKTOK_OPENSDK_REDIRECT_URI`**、**后端兑换接口入参 `redirectUri`** **完全一致**（含 `https://`、路径、末尾是否带 `/`）。
   - TikTok 通常要求 **HTTPS** 域名（例如 `https://api.example.com/facial/auth/tiktok/callback`），**不要用**本仓库里的占位域名；具体以控制台校验规则为准。
5. 记录 **Client Key**（部分文档也称 Client Key，与 iOS/Android 原生配置中的 **TikTokClientKey** 对应）。

---

## 二、本应用：iOS

### 1. `Info.plist`（`ios/ImageAIApp/Info.plist`）

| 键 | 说明 |
|----|------|
| **`TikTokClientKey`** | 填开放平台上的 **Client Key**，替换占位符 `YOUR_TIKTOK_CLIENT_KEY`。 |
| **`CFBundleURLTypes` 中 TikTok 一项** | **`CFBundleURLSchemes`** 填 **与 Client Key 相同的字符串**（当前工程结构与 TikTok SDK 常见要求一致：scheme = Client Key）。替换 `YOUR_TIKTOK_CLIENT_KEY`。 |

### 2. `AppDelegate`（已接入）

`AppDelegate.swift` 已调用 **`TikTokURLHandler.handleOpenURL`**（含 Universal Link 的 `continue userActivity`），一般无需再改；若升级 SDK 后文档要求额外回调，按官方迁移说明补充即可。

### 3. 环境变量 / JS 配置

在 **`.env`**（若项目通过构建注入 `process.env`）或构建脚本中设置：

```bash
TIKTOK_OPENSDK_REDIRECT_URI=https://你的域名/与开放平台完全一致的路径
```

该值会进入 **`src/api/config.ts`** 的 **`authConfig.tiktokOpenSdkRedirectUri`**，并传给：

- OpenSDK：`authorize({ redirectURI, scopes, callback })`
- 后端：`exchangeTikTokSdkCode({ authCode, codeVerifier, redirectUri })`

**未配置**时：OpenSDK 会因缺少 `redirectURI` 直接失败，前端会自动 **走 WebView OAuth**（依赖后端 `authorize-url?provider=tiktok`）。

---

## 三、本应用：Android

### 1. `AndroidManifest.xml`

在 **`android/app/src/main/AndroidManifest.xml`** 的 `<application>` 内，将：

```xml
<meta-data
    android:name="TikTokClientKey"
    android:value="YOUR_TIKTOK_CLIENT_KEY" />
```

中的 **`android:value`** 改为与开放平台一致的 **Client Key**。

### 2. 与 iOS 相同的 `redirect_uri`

同样通过 **`TIKTOK_OPENSDK_REDIRECT_URI`**（或最终在 `authConfig` 中的值）保证与 TikTok 后台、后端一致。

### 3. `MainActivity` 与深链

OAuth **回退** 成功后，后端会跳转到 **`imageai://auth/tiktok?token=...`**。工程已在 **MainActivity** 上配置 **`scheme=imageai` / `host=auth`** 的 intent-filter，与 [X 登录配置流程](./X_LOGIN_CONFIG.md) 中「Android 深链」一致，**TikTok 与 X 共用同一套 `imageai` 唤起方式**，无需为 TikTok 单独增加 scheme（路径为 `/tiktok` 时仍匹配 `host=auth`）。

---

## 四、后端接口（须与前端路径一致）

当前 **`baseURL`** 默认为 `https://api.petsai.net/facial`，前端实际请求为：

| 用途 | 方法 | 路径（相对 baseURL） |
|------|------|------------------------|
| 取 WebView 授权页 URL | `GET` | `/auth/social/authorize-url?provider=tiktok` |
| OpenSDK 兑换 Firebase `idToken` | `POST` | `/auth/social/tiktok/sdk-exchange` |
| 统一登录 | `POST` | `/app/user/snsThreePartyLogin`（`loginFrom: 9`，body 含 `idToken`） |

### `POST /auth/social/tiktok/sdk-exchange`

建议 Body（与 `src/api/services/auth.ts` 中 `exchangeTikTokSdkCode` 一致）：

```json
{
  "authCode": "TikTok 授权返回的 code",
  "codeVerifier": "Android 若 SDK 返回则必填，与 TikTok 文档一致",
  "redirectUri": "与前端 TIKTOK_OPENSDK_REDIRECT_URI、开放平台配置一致"
}
```

响应需至少包含其一（当前前端只使用 **`idToken`** 再走 Firebase 登录接口）：

- `{ "idToken": "<Firebase ID Token>" }`（或与现有响应包装层一致，如 `data.idToken` / `entry`，需与 `request` 层解析对齐），或  
- 直接返回与 `snsThreePartyLogin` 相同结构的 **app `token` + 用户信息**（若你扩展了解析逻辑）。

### WebView 回退：授权完成后的重定向

用户在内嵌浏览器完成授权后，服务端最终应 **302** 到：

```text
imageai://auth/tiktok?token=<Firebase_idToken>
```

应用已在 `RootNavigator` 中解析该深链并调用 **`snsThreePartyLogin(idToken, 9)`**。

---

## 五、配置对照表

| 配置项 | 说明 |
|--------|------|
| TikTok 开放平台 Redirect URI | 与 `TIKTOK_OPENSDK_REDIRECT_URI`、`sdk-exchange` 的 `redirectUri` 一致 |
| iOS `TikTokClientKey` + URL Scheme | 均为 **Client Key** |
| Android `TikTokClientKey` meta-data | **Client Key** |
| 深链 `imageai://auth/tiktok?token=...` | iOS/Android 已注册 `imageai`（与 X 共用） |
| 后端 `GET .../authorize-url?provider=tiktok` | WebView 回退必需 |
| 后端 `POST .../tiktok/sdk-exchange` | OpenSDK 成功路径必需 |

---

## 六、验证步骤

1. **深链（不依赖 TikTok 服务器）**  
   - iOS：Safari 打开 `imageai://auth/tiktok?token=test`（仅验证能否唤起 App）。  
   - Android：`adb shell am start -a android.intent.action.VIEW -d "imageai://auth/tiktok?token=test"`  

2. **OpenSDK**  
   配置好 **Client Key** 与 **`TIKTOK_OPENSDK_REDIRECT_URI`** 后，在真机安装 **TikTok 客户端**（若 SDK 走 App 跳转），点击登录面板的 **TikTok**，观察是否拿到 `authCode` 及后端 `sdk-exchange` 是否返回 `idToken`。

3. **WebView 回退**  
   临时清空 `TIKTOK_OPENSDK_REDIRECT_URI` 或断开后端 `sdk-exchange`，应自动打开 WebView；确认 `authorize-url` 返回合法 URL，且结束后能跳到 `imageai://auth/tiktok?token=...`。

### 常见问题

| 现象 | 可能原因 |
|------|----------|
| 提示缺少 `redirectURI` | 未设置 `TIKTOK_OPENSDK_REDIRECT_URI` 或 Metro/构建未注入 `process.env` |
| 授权成功但兑换失败 | `redirectUri` 与开放平台不一致，或后端未正确用 `authCode` 调 TikTok Token 接口 |
| 无法唤起 App | `imageai` scheme 被改坏或未重新安装；对照 [X_LOGIN_CONFIG.md](./X_LOGIN_CONFIG.md) 检查 Android intent-filter / iOS URL Types |

---

更整体的接口约定见 **[THIRD_PARTY_LOGIN.md](./THIRD_PARTY_LOGIN.md)**。
