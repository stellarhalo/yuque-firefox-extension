# Firefox 开发指南

## 环境要求

- Firefox 109+（支持 Manifest V3）
- Node.js 16+
- npm 或 yarn

## 开发模式

### 启动 Firefox 开发环境

```bash
# 安装依赖
npm install

# 启动 Firefox 开发模式
npm run dev:firefox
```

### 手动加载扩展

1. 打开 Firefox，访问 `about:debugging#/runtime/this-firefox`
2. 点击"临时加载附加组件"
3. 选择 `dist/[version]/manifest.json`

## 构建

### 构建 Firefox 版本

```bash
# 构建 Firefox 版本
npm run build:firefox
```

### 构建产物

- Chrome/Edge: `dist/yuque-chrome-extension-[version].zip`
- Firefox: `dist/yuque-firefox-extension-[version].zip`

## 已知限制

### 1. Side Panel API

Firefox 不支持 Chrome 的 Side Panel API。插件使用 content script 模拟侧边栏功能。

### 2. declarativeNetRequest

Firefox 对 declarativeNetRequest 的支持有限。某些 header 修改功能可能不可用。

### 3. 某些权限

以下权限在 Firefox 中不可用或行为不同：
- `declarativeNetRequest`
- `sidePanel`

这些权限已移至 `optional_permissions`，插件会在不支持时自动降级。

## 调试

### 查看扩展日志

1. 打开 Firefox 开发者工具
2. 访问 `about:debugging#/runtime/this-firefox`
3. 点击"检查"按钮查看背景脚本日志

### 常见问题

#### 1. 扩展无法加载

- 确保 Firefox 版本 >= 109
- 检查 manifest.json 格式是否正确
- 查看浏览器控制台错误信息

#### 2. 功能不可用

- 检查权限是否正确请求
- 查看浏览器控制台是否有 API 不支持的警告

## 发布

### Firefox Add-ons

1. 访问 https://addons.mozilla.org/
2. 使用 `web-ext` 工具打包：
   ```bash
   npx web-ext build --source-dir=./dist/[version]
   ```
3. 上传生成的 zip 文件

## 测试清单

- [ ] 扩展可以正常安装
- [ ] 背景脚本正常运行
- [ ] Content script 正常注入
- [ ] 右键菜单功能正常
- [ ] 快捷键功能正常
- [ ] 剪藏功能正常
- [ ] OCR 功能正常
- [ ] 侧边栏（模拟）功能正常
- [ ] 设置页面正常
