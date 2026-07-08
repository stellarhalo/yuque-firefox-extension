# 语雀 Firefox 浏览器插件

> 基于 [yuque-chrome-extension](https://github.com/yuque/yuque-chrome-extension) 适配 Firefox 浏览器

---

[English](README.en.md)

## 项目背景

[yuque-chrome-extension](https://github.com/yuque/yuque-chrome-extension) 是语雀官方推出的浏览器插件，支持 Chrome/Edge 浏览器。然而，该插件并未提供对 Firefox 浏览器的官方适配。

本项目基于语雀 Chrome 插件源码，进行了 Firefox 浏览器的适配工作，使 Firefox 用户也能享受到语雀插件带来的便利功能。

### 致谢

本项目的开发过程中，得到了以下 AI 模型的大力支持与帮助：

- **MiniMax M3** - 在代码架构设计与问题分析方面提供了宝贵建议
- **GLM 5.2** - 在 Manifest V3 适配与 Firefox API 兼容性方面给予指导
- **Mimo V2.5** - 在构建流程优化与打包配置方面贡献了重要思路

特别感谢这些 AI 模型在技术难题攻关中提供的帮助，使本项目能够顺利完成 Firefox 适配工作。

## 功能特性

- **页面剪藏**：支持剪藏网页文本、图片，一键保存到语雀
- **OCR 文字识别**：截图识别文字，方便提取图片中的内容
- **划词剪藏**：选中页面文字快速保存
- **翻译功能**：选中文字即可翻译
- **侧边栏笔记**：在侧边栏中直接创建和编辑笔记
- **全文剪藏**：一键保存整个网页内容
- **快捷键支持**：
  - `Ctrl+.` (Windows) / `Command+.` (Mac)：打开插件
  - 选取剪藏、OCR 提取、全文剪藏等快捷操作

## 安装方法

### 方法一：临时安装（推荐测试使用）

1. 下载最新版本的 `yuque-firefox-extension-*.zip` 文件
2. 打开 Firefox 浏览器
3. 在地址栏输入 `about:debugging#/runtime/this-firefox`
4. 点击 **"Load Temporary Add-on..."**
5. 选择下载的 zip 文件
6. 插件安装完成

### 方法二：开发者模式安装

1. 克隆本仓库
2. 运行构建命令：
   ```bash
   npm install
   npm run build:firefox
   ```
3. 在 Firefox 中加载 `dist/` 目录

## 开发指南

### 环境要求

- Node.js >= 16
- npm >= 7
- Firefox >= 109

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动 Firefox 开发模式
npm run dev:firefox
```

### 构建生产版本

```bash
# 构建 Firefox 正式版
npm run bundle:firefox

# 构建 Firefox Beta 版
npm run bundle:firefox:beta

# 构建所有版本并打包
npm run build:firefox
```

### 打包

```bash
# 打包成 zip 文件
npm run pack-zip
```

构建产物将输出到 `dist/` 目录：
- `yuque-firefox-extension-{version}.zip` - Firefox 正式版
- `yuque-firefox-extension-{version}-beta.zip` - Firefox Beta 版

## 技术说明

### Manifest V3 适配

本项目使用 Manifest V3 格式，主要变更包括：

- 使用 `service_worker` 替代传统的 `background.scripts`
- 权限声明方式调整
- `content_security_policy` 配置优化

### Firefox 特有配置

```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "yuque-extension@yuque.com",
      "strict_min_version": "109.0"
    }
  }
}
```

### 与 Chrome 版本的差异

| 特性 | Chrome | Firefox |
|------|--------|---------|
| Background | Service Worker | Event Pages |
| Side Panel | 支持 | 需额外适配 |
| 权限模型 | Manifest V3 | Manifest V3 (Firefox 特有) |
| 最低版本 | Chrome 88+ | Firefox 109+ |

## 相关链接

- [语雀官网](https://www.yuque.com)
- [原 Chrome 插件仓库](https://github.com/yuque/yuque-chrome-extension)
- [语雀插件文档](https://www.yuque.com/yuque/yuque-browser-extension/welcome)

## 许可证

本项目基于原项目代码改编，遵循相应的开源协议。

---

> 本项目由个人开发者维护，旨在为 Firefox 用户提供语雀插件支持。如有问题或建议，欢迎提交 Issue。
