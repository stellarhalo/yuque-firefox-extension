# Firefox 浏览器支持实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为语雀浏览器插件添加 Firefox 支持，保持与现有 Chrome/Edge 兼容性

**Architecture:** 通过浏览器检测抽象层和条件化 manifest 配置，实现跨浏览器兼容。Firefox 不支持 sidePanel API，将使用 popup 替代方案。

**Tech Stack:** TypeScript, WebExtension API, webpack, Manifest V3

---

## 文件结构

### 修改的文件
- `src/manifest.json` - 添加 Firefox 兼容性配置
- `src/isomorphic/env.ts` - 浏览器检测和协议适配
- `src/background/core/chromeExtension.ts` - 浏览器 API 抽象层
- `src/background/index.ts` - 处理 declarativeNetRequest 差异
- `src/background/browser-action.ts` - Firefox action 点击处理
- `src/pages/inject/content-scripts.ts` - 运行时获取 URL 适配
- `src/common/declare.ts` - 类型声明扩展
- `webpack.config.js` - Firefox 构建支持
- `scripts/build-zip.sh` - Firefox 构建脚本

### 新增的文件
- `src/firefox-polyfill.ts` - Firefox API polyfill
- `src/manifest-firefox.json` - Firefox 专用 manifest（可选方案）

---

## Task 1: 创建浏览器检测和 API 抽象层

**Files:**
- Modify: `src/isomorphic/env.ts`
- Create: `src/firefox-polyfill.ts`
- Modify: `src/background/core/chromeExtension.ts`

- [ ] **Step 1: 扩展 env.ts 添加浏览器检测**

```typescript
// src/isomorphic/env.ts
class Env {
  static get isBackground(): boolean {
    return typeof window === 'undefined';
  }

  // 检测是否是 Firefox 浏览器
  static get isFirefox(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent.includes('Firefox');
    }
    return false;
  }

  // 检测是否是 Chrome/Edge 浏览器
  static get isChromium(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edg/');
    }
    return false;
  }

  // 获取扩展协议前缀
  static get extensionProtocol(): string {
    return Env.isFirefox ? 'moz-extension://' : 'chrome-extension://';
  }

  // 是否是插件的页面
  static get isExtensionPage() {
    if (!Env.isBackground) {
      const url = window.location.href;
      if (url.startsWith(Env.extensionProtocol)) {
        return true;
      }
      return false;
    }
    return true;
  }

  // 判断是否是 beta 版插件
  static get isBate() {
    if (chrome.runtime.getManifest().name.includes('Beta')) {
      return true;
    }
    return false;
  }

  // 是否运行在宿主页面
  static get isRunningHostPage() {
    return window.self !== window.top;
  }
}

export default Env;
```

- [ ] **Step 2: 创建 Firefox polyfill**

```typescript
// src/firefox-polyfill.ts
/**
 * Firefox 浏览器 polyfill
 * 处理 Firefox 与 Chrome API 的差异
 */

// Firefox 的 browser API 命名空间
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// 导出统一的 API
export const extensionAPI = {
  runtime: browserAPI.runtime,
  tabs: browserAPI.tabs,
  storage: browserAPI.storage,
  cookies: browserAPI.cookies,
  contextMenus: browserAPI.contextMenus,
  action: browserAPI.action || browserAPI.browserAction,
  scripting: browserAPI.scripting,
  commands: browserAPI.commands,
  webRequest: browserAPI.webRequest,
};

// Firefox 的 declarativeNetRequest 支持有限，提供降级方案
export const supportsDeclarativeNetRequest = () => {
  return typeof chrome.declarativeNetRequest !== 'undefined';
};

// 获取扩展资源 URL 的 polyfill
export const getExtensionURL = (path: string): string => {
  return chrome.runtime.getURL(path);
};

export default extensionAPI;
```

- [ ] **Step 3: 修改 chromeExtension.ts 支持双浏览器**

```typescript
// src/background/core/chromeExtension.ts
import { getMsgId } from '@/isomorphic/util';
import Env from '@/isomorphic/env';

// Firefox 兼容的 API 包装
const getBrowserAction = () => {
  // Firefox 可能使用 browserAction 而不是 action
  if (chrome.action) {
    return chrome.action;
  }
  // @ts-ignore - Firefox MV2 兼容
  return chrome.browserAction;
};

const chromeExtension = {
  action: getBrowserAction(),
  cookies: chrome.cookies,
  contextMenus: chrome.contextMenus,
  runtime: chrome.runtime,
  storage: chrome.storage,
  tabs: {
    ...chrome.tabs,
    getCurrentTab: async (tab?: chrome.tabs.Tab) => {
      if (tab?.id) {
        return tab;
      }
      const tabs = await chrome.tabs.query({ lastFocusedWindow: true, active: true });
      return tabs[0];
    },
    sendMessageToCurrentTab: async (message: any, tab?: chrome.tabs.Tab) => {
      const currentTab = await chromeExtension.tabs.getCurrentTab(tab);
      if (!currentTab?.id) {
        return null;
      }
      const response = await chrome.tabs.sendMessage(currentTab.id, message);
      return response;
    },
    sendMessageToAllTab: async (message: any) => {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          if (tab.id) {
            await chrome.tabs.sendMessage(tab.id, message);
          }
        } catch (error) {
          // Firefox 可能对某些 tab 发送消息失败
          if (!Env.isFirefox) {
            console.error('Failed to send message to tab:', error);
          }
        }
      }
    },
    async sendToContent(tab: chrome.tabs.Tab, type: string, data: any, id?: string) {
      const params = {
        type,
        data,
        id: id || getMsgId({ type }),
      };
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, params);
      }
    },
  },
  webRequest: chrome.webRequest,
  declarativeNetRequest: chrome.declarativeNetRequest,
  windows: chrome.windows,
  downloads: chrome.downloads,
  scripting: chrome.scripting,
  commands: chrome.commands,
  sendMessageToCurrentTab: (message: any) =>
    new Promise(resolve => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, res => {
        const tabId = res[0]?.id;
        if (!tabId) {
          resolve(null);
          return;
        }
        chrome.tabs.sendMessage(tabId, message, res1 => {
          resolve(res1);
        });
      });
    }),
  sendMessageToAllTab: (message: any) => {
    new Promise(resolve => {
      chrome.tabs.query({ status: 'complete' }, res => {
        for (const tab of res) {
          if (tab.id) {
            try {
              chrome.tabs.sendMessage(tab.id, message, res1 => {
                resolve(res1);
              });
            } catch (e) {
              // Firefox 兼容
            }
          }
        }
      });
    });
  },
};

export default chromeExtension;
```

- [ ] **Step 4: 验证修改**

```bash
npm run type:check
```

Expected: 无类型错误

---

## Task 2: 修改 manifest.json 支持 Firefox

**Files:**
- Modify: `src/manifest.json`

- [ ] **Step 1: 添加 Firefox 特定配置**

```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background-wrapper.js",
    "scripts": ["background-wrapper.js"]
  },
  "description": "语雀浏览器知识管理插件，支持剪藏页面文本和图片，截图OCR识别文字，可划词剪藏、翻译，侧边栏写笔记，并存到语雀。",
  "action": {},
  "content_scripts": [
    {
      "js": [
        "content-scripts.js"
      ],
      "matches": [
        "<all_urls>",
        "*://*/*"
      ],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "yuque-logo-16.png",
    "32": "yuque-logo-32.png",
    "48": "yuque-logo-48.png",
    "128": "yuque-logo-128.png"
  },
  "web_accessible_resources": [
    {
      "resources": [
        "content-scripts.css",
        "editor.html",
        "sidePanel.html",
        "doc.css",
        "doc.umd.js",
        "CodeMirror.js",
        "katex.min.js",
        "tracert_a385.js",
        "antd.4.24.13.css",
        "lake-editor-icon.js",
        "react.production.min.js",
        "react-dom.production.min.js",
        "inject-content-script.js"
      ],
      "matches": [
        "<all_urls>",
        "*://*/*"
      ]
    }
  ],
  "content_security_policy": {
    "script-src": "'self' 'unsafe-eval'",
    "object-src": "'self'"
  },
  "host_permissions": [
    "<all_urls>",
    "*://*/*"
  ],
  "permissions": [
    "activeTab",
    "contextMenus",
    "cookies",
    "storage",
    "tabs",
    "webRequest",
    "scripting"
  ],
  "optional_permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "sidePanel"
  ],
  "browser_specific_settings": {
    "gecko": {
      "id": "yuque-extension@yuque.com",
      "strict_min_version": "109.0"
    }
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Period",
        "mac": "Command+Period"
      }
    },
    "selectArea": {
      "description": "选取剪藏"
    },
    "startOcr": {
      "description": "OCR 提取"
    },
    "clipPage": {
      "description": "全文剪藏"
    }
  }
}
```

关键变更：
1. 添加 `browser_specific_settings.gecko` 用于 Firefox 识别
2. 将 `declarativeNetRequest` 和 `sidePanel` 移至 `optional_permissions`
3. 添加 `background.scripts` 作为 Firefox 的备选方案
4. 设置 `strict_min_version` 为 Firefox 109+（支持 MV3）

- [ ] **Step 2: 验证 manifest 格式**

```bash
cat src/manifest.json | python3 -m json.tool
```

Expected: JSON 格式正确

---

## Task 3: 处理 sidePanel API 兼容性

**Files:**
- Modify: `src/background/index.ts`
- Modify: `src/background/actionListener/sidePanel.ts`
- Modify: `src/background/browser-action.ts`

- [ ] **Step 1: 修改 background/index.ts 添加 sidePanel 检测**

```typescript
// src/background/index.ts - 修改 onInstalled 部分
chromeExtension.runtime.onInstalled.addListener(async details => {
  console.log('-- runtime installed');

  createContextMenu();
  
  // 仅在支持 declarativeNetRequest 的浏览器上更新规则
  if (chromeExtension.declarativeNetRequest) {
    updateDynamicRules();
  }
  
  updateYuqueCookieRule();

  if (details.reason === 'install') {
    chromeExtension.tabs.create({
      url: LinkHelper.introduceExtension,
    });
  }

  // ... 其余代码保持不变
});

// 修改 updateDynamicRules 函数
function updateDynamicRules() {
  if (!chromeExtension.declarativeNetRequest) {
    console.log('declarativeNetRequest not supported, skipping dynamic rules');
    return;
  }
  
  chromeExtension.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      // ... 规则保持不变
    ],
  });
}

// 修改 updateYuqueCookieRule 函数
const updateYuqueCookieRule = async () => {
  // ... cookie 获取逻辑保持不变
  
  if (!chromeExtension.declarativeNetRequest) {
    console.log('declarativeNetRequest not supported, skipping cookie rules');
    return;
  }
  
  chromeExtension.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [2],
    addRules: [
      // ... 规则保持不变
    ],
  });
};
```

- [ ] **Step 2: 修改 sidePanel.ts 支持 Firefox**

```typescript
// src/background/actionListener/sidePanel.ts
import { OperateSidePanelEnum, IOperateSidePanelData } from '@/isomorphic/background/sidePanel';
import chromeExtension from '../core/chromeExtension';
import Env from '@/isomorphic/env';
import { RequestMessage } from './index';

export async function createSidePanelActionListener(
  request: RequestMessage<IOperateSidePanelData>,
  callback: (params: any) => void,
  sender: chrome.runtime.MessageSender,
) {
  const { type } = request.data;
  const currentTab = await chromeExtension.tabs.getCurrentTab(sender.tab);
  
  if (!currentTab?.id) {
    callback({ error: 'No active tab' });
    return;
  }

  // Firefox 不支持 sidePanel API，使用 content script 模拟
  if (Env.isFirefox) {
    switch (type) {
      case OperateSidePanelEnum.close: {
        chromeExtension.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            func: () => {
              return window._yuque_ext_app.toggleSidePanel(false);
            },
          },
          res => {
            callback(res?.[0]?.result);
          },
        );
        break;
      }
      case OperateSidePanelEnum.open: {
        chromeExtension.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            func: () => {
              return window._yuque_ext_app.toggleSidePanel(true);
            },
          },
          res => {
            callback(res?.[0]?.result);
          },
        );
        break;
      }
      default:
        break;
    }
    return;
  }

  // Chrome/Edge 使用原生 sidePanel API
  switch (type) {
    case OperateSidePanelEnum.close: {
      chromeExtension.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          func: () => {
            return window._yuque_ext_app.toggleSidePanel(false);
          },
        },
        res => {
          callback(res?.[0]?.result);
        },
      );
      break;
    }
    case OperateSidePanelEnum.open: {
      chromeExtension.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          func: () => {
            return window._yuque_ext_app.toggleSidePanel(true);
          },
        },
        res => {
          callback(res?.[0]?.result);
        },
      );
      break;
    }
    default:
      break;
  }
}
```

- [ ] **Step 3: 修改 browser-action.ts 支持 Firefox**

```typescript
// src/background/browser-action.ts
import chromeExtension from './core/chromeExtension';
import Env from '@/isomorphic/env';

export function listenBrowserActionEvent() {
  // 获取 action API（Firefox 兼容）
  const actionAPI = chromeExtension.action;
  
  if (!actionAPI) {
    console.log('Action API not available');
    return;
  }

  actionAPI.onClicked.addListener(async tab => {
    const currentTab = await chromeExtension.tabs.getCurrentTab(tab);
    
    if (!currentTab?.id) {
      return;
    }

    chromeExtension.scripting.executeScript(
      {
        target: { tabId: currentTab.id },
        func: () => {
          try {
            return window._yuque_ext_app.toggleSidePanel();
          } catch (e) {
            return { error: e };
          }
        },
      },
      res => {
        if (res?.[0]?.result?.error) {
          const msg = __i18n('你需要重新加载该页面才能剪藏。请重新加载页面后再试一次');
          chromeExtension.scripting.executeScript({
            target: { tabId: currentTab.id },
            args: [{ msg }],
            func: (args: { msg: string }) => {
              window.alert(args.msg);
            },
          });
        }
      },
    );
  });
}
```

- [ ] **Step 4: 验证修改**

```bash
npm run type:check
```

---

## Task 4: 修改 content scripts 支持 Firefox

**Files:**
- Modify: `src/pages/inject/content-scripts.ts`

- [ ] **Step 1: 修改 content-scripts.ts 的 URL 获取**

```typescript
// src/pages/inject/content-scripts.ts
import { initI18N } from '@/isomorphic/i18n';
import { ClipAssistantMessageActions } from '@/isomorphic/event/clipAssistant';
import {
  InjectScriptRequestKey,
  InjectScriptResponseKey,
  MessageEventRequestData,
  MessageEventResponseData,
} from '@/isomorphic/injectScript';
import { getMsgId } from '@/isomorphic/util';
import { parseDom } from '@/core/parseDom';
import { ContentScriptAppRef, ShowMessageConfig, createContentScriptApp } from './app';
import { showSelectArea } from './AreaSelector';
import { showScreenShot } from './ScreenShot';

export class App {
  private _rootContainer: HTMLDivElement | null = null;
  private _shadowRoot: ShadowRoot | null = null;
  private contentScriptAppRef: React.RefObject<ContentScriptAppRef> | null = null;
  public isOperateSelecting = false;

  public removeWordMark: VoidCallback = () => {
    //
  };

  constructor() {
    this.initRoot();
    // 注入 inject-content-script.js - 修复 Firefox 兼容性
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject-content-script.js');
    document.body.append(script);
    script.onload = () => {
      script.parentNode?.removeChild(script);
    };
  }

  get rootContainer(): HTMLDivElement {
    return this._rootContainer as HTMLDivElement;
  }

  get shadowRoot(): ShadowRoot {
    return this._shadowRoot as ShadowRoot;
  }

  private initRoot() {
    const div = document.createElement('div');
    div.id = 'yuque-extension-root-container';
    div.classList.add('yuque-extension-root-container-class');
    
    // 获取 CSS URL - Firefox 兼容
    const cssUrl = chrome.runtime.getURL('content-scripts.css');
    
    fetch(cssUrl)
      .then(response => response.text())
      .then(cssContent => {
        const style = document.createElement('style');
        style.textContent = cssContent;
        const shadowRoot = div.attachShadow({ mode: 'open' });
        this._shadowRoot = shadowRoot;
        const root = document.createElement('div');
        this._rootContainer = root;
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(root);
        this._shadowRoot = shadowRoot;
        document.body.appendChild(div);
        const { ref } = createContentScriptApp();
        this.contentScriptAppRef = ref;
      })
      .catch(error => {
        console.error('Failed to load CSS:', error);
        // Firefox 可能需要不同的处理方式
        const shadowRoot = div.attachShadow({ mode: 'open' });
        this._shadowRoot = shadowRoot;
        const root = document.createElement('div');
        this._rootContainer = root;
        shadowRoot.appendChild(root);
        this._shadowRoot = shadowRoot;
        document.body.appendChild(div);
        const { ref } = createContentScriptApp();
        this.contentScriptAppRef = ref;
      });
  }

  // ... 其余方法保持不变
}

function initSandbox() {
  initI18N();
  window._yuque_ext_app = window._yuque_ext_app || new App();
}

initSandbox();
```

- [ ] **Step 2: 验证修改**

```bash
npm run type:check
```

---

## Task 5: 修改构建配置支持 Firefox

**Files:**
- Modify: `webpack.config.js`
- Modify: `scripts/build-zip.sh`
- Modify: `package.json`

- [ ] **Step 1: 修改 webpack.config.js 添加 Firefox 构建**

```javascript
// webpack.config.js - 在文件开头添加
const isFirefox = process.env.BROWSER === 'firefox';
const isBeta = process.env.BETA === 'beta';

// ... 其余代码保持不变，但修改 CopyWebpackPlugin 部分
new CopyWebpackPlugin({
  patterns: [
    {
      from: path.join(srcPath, 'manifest.json'),
      transform(content) {
        const origin = JSON.parse(content.toString());
        const value = Object.assign({
          version: pkg.version,
          name: pkg.description,
        }, origin);
        
        if (isBeta) {
          value.name = `${value.name} Beta`;
        }
        
        // Firefox 特定配置
        if (isFirefox) {
          // 移除 Firefox 不支持的权限
          if (value.permissions) {
            value.permissions = value.permissions.filter(
              p => !['declarativeNetRequest', 'declarativeNetRequestWithHostAccess', 'sidePanel'].includes(p)
            );
          }
          
          // 确保 optional_permissions 存在
          if (!value.optional_permissions) {
            value.optional_permissions = [];
          }
          
          // 移除 side_panel 配置
          delete value.side_panel;
          
          // 确保 browser_specific_settings 存在
          if (!value.browser_specific_settings) {
            value.browser_specific_settings = {
              gecko: {
                id: 'yuque-extension@yuque.com',
                strict_min_version: '109.0'
              }
            };
          }
        }
        
        return Buffer.from(JSON.stringify(value, null, 2));
      },
    },
    {
      from: path.join(srcPath, 'background/background-wrapper.js'),
      to: path.join(distPath, isBeta ? `${pkg.version}-beta` : pkg.version, 'background-wrapper.js'),
    },
  ],
}),
```

- [ ] **Step 2: 修改 package.json 添加 Firefox 构建脚本**

```json
{
  "scripts": {
    "pack-zip": "sh ./scripts/build-zip.sh",
    "bundle": "NODE_ENV=production webpack --mode=production",
    "bundle:beta": "NODE_ENV=production BETA=beta webpack --mode=production",
    "bundle:firefox": "NODE_ENV=production BROWSER=firefox webpack --mode=production",
    "bundle:firefox:beta": "NODE_ENV=production BROWSER=firefox BETA=beta webpack --mode=production",
    "build": "npm run bundle && npm run bundle:beta && npm run pack-zip",
    "build:firefox": "npm run bundle:firefox && npm run bundle:firefox:beta && npm run pack-zip",
    "clean:dist": "sh ./scripts/clean.sh",
    "postinstall": "npm run clean:dist",
    "contributor": "git-contributor",
    "dev": "NODE_ENV=development webpack --mode=development",
    "dev:firefox": "NODE_ENV=development BROWSER=firefox webpack --mode=development",
    "docs:dev": "vuepress dev docs",
    "type:check": "tsc --noEmit",
    "lint:js": "eslint . --fix",
    "lint:less": "stylelint --fix ./**/*.less -s less",
    "lint": "npm run lint:js && npm run lint:less",
    "lint-staged": "lint-staged",
    "translate": "easy-i18n-cli -c ./i18n.config.js",
    "translate:check": "npm run translate -- --check",
    "update:assets": "node ./tools/dev-tools/generate-svg-map.js",
    "watch": "open -a chromium --args --load-extension=\"$PWD/dist/$npm_package_version\" --force-dev-mode-highlighting --no-default-browser-check",
    "watch:firefox": "web-ext run --source-dir=./dist/$npm_package_version --firefox=firefox"
  }
}
```

- [ ] **Step 3: 修改 build-zip.sh 支持 Firefox**

```bash
#!/bin/bash
# scripts/build-zip.sh

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

# 创建 dist 目录（如果不存在）
mkdir -p dist

# Chrome/Edge 构建
echo "Building for Chrome/Edge..."
cd dist/$VERSION
zip -r "../yuque-chrome-extension-$VERSION.zip" . -x "*.DS_Store"
cd ../..

# Firefox 构建
if [ -d "dist/$VERSION-firefox" ]; then
  echo "Building for Firefox..."
  cd dist/$VERSION-firefox
  zip -r "../yuque-firefox-extension-$VERSION.zip" . -x "*.DS_Store"
  cd ../..
fi

echo "Build complete!"
```

- [ ] **Step 4: 验证构建**

```bash
npm run bundle:firefox
```

Expected: 构建成功，无错误

---

## Task 6: 更新类型声明

**Files:**
- Modify: `src/common/declare.ts`
- Modify: `src/typings.d.ts`

- [ ] **Step 1: 扩展类型声明**

```typescript
// src/common/declare.ts
// 添加 Firefox 的 browser API 类型声明
declare namespace browser {
  namespace runtime {
    function getURL(path: string): string;
    function sendMessage(message: any): Promise<any>;
    // ... 其他 API
  }
  namespace tabs {
    function query(queryInfo: object): Promise<chrome.tabs.Tab[]>;
    function sendMessage(tabId: number, message: any): Promise<any>;
    // ... 其他 API
  }
  // ... 其他命名空间
}

// 确保 window._yuque_ext_app 类型正确
interface Window {
  _yuque_ext_app: {
    toggleSidePanel(visible?: boolean): Promise<void>;
    addContentToClipAssistant(html: string, expandSidePanel?: boolean): Promise<void>;
    clipSelectArea(params?: { isRunningHostPage: boolean; formShortcut: boolean }): Promise<string>;
    clipScreenOcr(params?: { isRunningHostPage: boolean; formShortcut: boolean }): Promise<string | null>;
    clipPage(): Promise<void>;
    showMessage(config: any): Promise<void>;
  };
}
```

- [ ] **Step 2: 验证类型**

```bash
npm run type:check
```

---

## Task 7: 创建 Firefox 开发文档

**Files:**
- Create: `docs/firefox-development.md`

- [ ] **Step 1: 创建 Firefox 开发指南**

```markdown
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
```

- [ ] **Step 2: 提交文档**

```bash
git add docs/firefox-development.md
git commit -m "docs: 添加 Firefox 开发指南"
```

---

## Task 8: 最终验证

**Files:**
- All modified files

- [ ] **Step 1: 运行完整类型检查**

```bash
npm run type:check
```

Expected: 无类型错误

- [ ] **Step 2: 运行 lint 检查**

```bash
npm run lint
```

Expected: 无 lint 错误

- [ ] **Step 3: 构建 Firefox 版本**

```bash
npm run build:firefox
```

Expected: 构建成功

- [ ] **Step 4: 在 Firefox 中测试**

1. 打开 Firefox，访问 `about:debugging#/runtime/this-firefox`
2. 点击"临时加载附加组件"
3. 选择 `dist/[version]/manifest.json`
4. 测试基本功能

- [ ] **Step 5: 提交所有修改**

```bash
git add .
git commit -m "feat: 添加 Firefox 浏览器支持

- 修改 manifest.json 添加 Firefox 兼容性配置
- 创建浏览器检测和 API 抽象层
- 处理 sidePanel API 不兼容问题
- 处理 declarativeNetRequest 降级
- 修改构建脚本支持 Firefox
- 添加 Firefox 开发文档"
```

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-07-06-firefox-support.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - 我为每个任务分发一个新的子代理，任务之间进行审查，快速迭代

**2. Inline Execution** - 在当前会话中使用 executing-plans 执行任务，批量执行并设置检查点

**选择哪种方式？**
