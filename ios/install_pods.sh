#!/bin/bash
# glog configure fails with device SDK ("C compiler cannot create executables").
# Use simulator SDK during pod install so the configure test can run on the host.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
rm -rf ~/Library/Caches/CocoaPods/Pods/External/glog 2>/dev/null || true
cd ..
bundle install
cd ios
PLATFORM_NAME=iphonesimulator bundle exec pod install
