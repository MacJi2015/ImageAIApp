#!/bin/bash
# 修复 glog 等 pod 安装失败：清理缓存后重新 pod install
set -e
cd "$(dirname "$0")/.."

echo "清理 CocoaPods 缓存中的 glog..."
rm -rf ~/Library/Caches/CocoaPods/Pods/External/glog 2>/dev/null || true

echo "清理 ios 下的 Pods 与构建产物..."
rm -rf ios/build ios/Pods ios/Podfile.lock

echo "进入 ios 并执行 pod install（使用模拟器 SDK 编译 glog，避免 iPhoneOS 下 C 编译器检查失败）..."
cd ios
# 使用 iphonesimulator 让 glog 的 configure 用模拟器 SDK，通常能通过 C compiler 检查
PLATFORM_NAME=iphonesimulator pod install
cd ..
echo "完成。"
