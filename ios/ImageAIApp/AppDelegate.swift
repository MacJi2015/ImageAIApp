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
    if TikTokURLHandler.handleOpenURL(url) {
      return true
    }
    if ApplicationDelegate.shared.application(app, open: url, options: options) {
      return true
    }
    return false
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
