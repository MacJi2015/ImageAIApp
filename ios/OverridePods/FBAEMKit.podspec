# 与官方 FBAEMKit 18.0.3 一致，仅将 source 改为国内可访问的 GitHub 镜像，避免 pod install 时 Connection reset by peer
# 官方: https://github.com/facebook/facebook-ios-sdk/blob/main/FBAEMKit.podspec
Pod::Spec.new do |s|
  s.name = 'FBAEMKit'
  s.version = '18.0.3'
  s.summary = 'The kernal module for Facebook AEM solution'
  s.description = <<-DESC
  The Facebook SDK for iOS GamingKit framework provides:
  * campaign level conversions from re-engagement ads.
  DESC
  s.homepage = 'https://developers.facebook.com/docs/ios/'
  s.license = {
    type: 'Facebook Platform License',
    text: <<-LICENSE
  Copyright (c) Meta Platforms, Inc. and affiliates. All rights reserved.
  You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
  copy, modify, and distribute this software in source code or binary form for use
  in connection with the web services and APIs provided by Facebook.
  LICENSE
  }
  s.author = 'Facebook'
  s.platform = :ios
  s.ios.deployment_target = '12.0'
  # 使用官方 GitHub 地址；国内请开代理后执行 pod install（export https_proxy=http://127.0.0.1:7890）
  s.source = {
    http: "https://github.com/facebook/facebook-ios-sdk/releases/download/v#{s.version}/FacebookSDK_Dynamic.xcframework.zip",
    sha1: 'af6532109a50e5ee1700bad34ae23b0f0764f8da'
  }
  s.vendored_frameworks = 'XCFrameworks/FBAEMKit.xcframework'
  s.dependency 'FBSDKCoreKit_Basics', "#{s.version}"
end
