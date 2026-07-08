#!/bin/bash
# scripts/build-zip.sh

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

# 创建 dist 目录（如果不存在）
mkdir -p dist

# Chrome/Edge 正式版
echo "Building for Chrome/Edge..."
if [ -d "dist/$VERSION" ]; then
  cd dist/$VERSION
  zip -r "../yuque-chrome-extension-$VERSION.zip" . -x "*.DS_Store"
  cd ../..
fi

# Chrome/Edge Beta 版
if [ -d "dist/$VERSION-beta" ]; then
  echo "Building for Chrome/Edge Beta..."
  cd dist/$VERSION-beta
  zip -r "../yuque-chrome-extension-$VERSION-beta.zip" . -x "*.DS_Store"
  cd ../..
fi

# Firefox 正式版
if [ -d "dist/$VERSION-firefox" ]; then
  echo "Building for Firefox..."
  cd dist/$VERSION-firefox
  zip -r "../yuque-firefox-extension-$VERSION.zip" . -x "*.DS_Store"
  cd ../..
fi

# Firefox Beta 版
if [ -d "dist/$VERSION-firefox-beta" ]; then
  echo "Building for Firefox Beta..."
  cd dist/$VERSION-firefox-beta
  zip -r "../yuque-firefox-extension-$VERSION-beta.zip" . -x "*.DS_Store"
  cd ../..
fi

echo "Build complete!"
