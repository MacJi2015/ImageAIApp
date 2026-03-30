import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FBSDKCoreKit
import TikTokOpenSDKCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ApplicationDelegate.shared.initializeSDK()
    FirebaseApp.configure()
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "ImageAIApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    // OAuth 深链须先于第三方 SDK：否则 TikTok/FB 若误判 true，会吞掉 imageai:// 且 JS 收不到回调
    if url.scheme?.caseInsensitiveCompare("imageai") == .orderedSame {
      NotificationCenter.default.post(
        name: NSNotification.Name("RCTOpenURLNotification"),
        object: nil,
        userInfo: ["url": url.absoluteString]
      )
      return true
    }
    if TikTokURLHandler.handleOpenURL(url) {
      return true
    }
    if ApplicationDelegate.shared.application(app, open: url, options: options) {
      return true
    }
    // React Native Linking：须触发与 RCTLinkingManager 相同的通知，否则其它自定义 scheme 到不了 JS
    NotificationCenter.default.post(
      name: NSNotification.Name("RCTOpenURLNotification"),
      object: nil,
      userInfo: ["url": url.absoluteString]
    )
    return true
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    if TikTokURLHandler.handleOpenURL(userActivity.webpageURL) {
      return true
    }
    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    // Prefer Metro dev server when available.
    // This avoids relying on Xcode/Swift "DEBUG" compilation flags being wired correctly.
    if let metroURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") {
      return metroURL
    }

    // Fallback for Release builds (or when Metro is not reachable).
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
  }
}
