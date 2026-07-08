#!/bin/bash
# scripts/build-zip.sh

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

# 创建 dist 目录（如果不存在）
mkdir -p dist

# Chrome/Edge 构建
echo "Building for Chrome/Edge..."
if [ -d "dist/$VERSION" ]; then
  cd dist/$VERSION
  zip -r "../yuque-chrome-extension-$VERSION.zip" . -x "*.DS_Store"
  cd ../..
fi

# Firefox 构建
if [ -d "dist/$VERSION-firefox" ]; then
  echo "Building for Firefox..."
  cd dist/$VERSION-firefox
  zip -r "../yuque-firefox-extension-$VERSION.zip" . -x "*.DS_Store"
  cd ../..
fi

echo "Build complete!"
