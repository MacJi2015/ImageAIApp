#!/bin/bash
# 使用 Homebrew Ruby 3.4 的 bundle 执行 pod install，避免系统 Ruby 2.6 缺 bundler
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BUNDLE="/usr/local/Cellar/ruby/3.4.4/bin/bundle"
if [ ! -x "$BUNDLE" ]; then
  BUNDLE="/opt/homebrew/Cellar/ruby/3.4.4/bin/bundle"
fi
if [ ! -x "$BUNDLE" ]; then
  echo "未找到 Homebrew Ruby 3.4 的 bundle，请先安装: brew install ruby"
  exit 1
fi

"$BUNDLE" install
"$BUNDLE" exec pod install
