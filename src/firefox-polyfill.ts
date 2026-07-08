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
