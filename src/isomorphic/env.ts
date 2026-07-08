/**
 * 后续所有环境判断的方法都迁移到这里来
 */
// 此模块仅在 background 入口引入时执行，标记当前模块运行在真正的后台 service worker 中
// Firefox MV3 service worker 有 navigator 和 document 多义，导致仅依赖 DOM 检测不可靠
declare const __YUQUE_BACKGROUND__: boolean | undefined;

class Env {
  static get isBackground(): boolean {
    try {
      // Firefox MV3 service worker 下，globalThis 会被标记
      // 仅 background.ts 入口会执行这行赋值，content/sidepanel/options 入口不会
      if (typeof __YUQUE_BACKGROUND__ !== 'undefined' && __YUQUE_BACKGROUND__ === true) {
        return true;
      }
    } catch (e) {
      // ignore
    }
    if (typeof window === 'undefined') {
      return true;
    }
    if (typeof document === 'undefined') {
      return true;
    }
    if (typeof self !== 'undefined' && self.constructor && self.constructor.name === 'ServiceWorkerGlobalScope') {
      return true;
    }
    try {
      const el = document.createElement('div');
      document.body.appendChild(el);
      document.body.removeChild(el);
    } catch (e) {
      return true;
    }
    return false;
  }

  // 检测是否是 Firefox 浏览器
  static get isFirefox(): boolean {
    try {
      if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')) {
        return true;
      }
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const url = chrome.runtime.getURL('');
        if (url.startsWith('moz-extension://')) {
          return true;
        }
      }
    } catch (e) {
      // ignore
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

  // 是否是插件的页面，插件的页面和 background 相类似，可以调用 chrome 系统的 api
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

  // 判断是否是 beta 版插件，所有非商店的插件都判断为 beta 版本
  static get isBate() {
    if (chrome.runtime.getManifest().name.includes('Beta')) {
      return true;
    }
    return false;
  }

  // 是否运行在宿主页面,供 sidePanel 类 iframe 使用
  static get isRunningHostPage() {
    return window.self !== window.top;
  }
}

export default Env;
