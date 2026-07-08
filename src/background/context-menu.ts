import { __i18n } from '@/isomorphic/i18n';
import chromeExtension from './core/chromeExtension';

const menuList = [
  {
    id: 'save-to-yuque-notes',
    title: '剪藏到语雀',
    contexts: ['selection'],
  },
  {
    id: 'save-to-yuque',
    title: '语雀插件',
    contexts: ['page'],
  },
  {
    id: 'save-to-yuque-image',
    title: '剪藏到语雀',
    contexts: ['image'],
  },
];

export function createContextMenu() {
  const fallback = ['剪藏到语雀', '语雀插件', '剪藏到语雀'];
  menuList.forEach((item, idx) => {
    let title: string;
    try {
      title = __i18n(item.title);
    } catch (e) {
      title = '';
    }
    // Firefox 不接受空 title（只显示图标），fallback 到中文原文保证必可显示
    if (!title) title = fallback[idx];
    chrome.contextMenus.create({
      id: item.id,
      title,
      contexts: item.contexts as any,
    });
  });
}

export function listenContextMenuEvents() {
  chromeExtension.contextMenus.onClicked.addListener(async (info, tab) => {
    const currentTab = await chromeExtension.tabs.getCurrentTab(tab);
    switch (info.menuItemId) {
      case menuList[0].id: {
        const { selectionText } = info;
        chromeExtension.scripting.executeScript({
          target: { tabId: currentTab?.id as number },
          args: [{ html: `${selectionText}` }],
          func: args => {
            window._yuque_ext_app.addContentToClipAssistant(args.html, true);
          },
        });
        break;
      }
      case menuList[1].id:
        chromeExtension.scripting.executeScript({
          target: { tabId: currentTab?.id as number },
          func: () => {
            return window._yuque_ext_app.toggleSidePanel();
          },
        });
        break;
      case menuList[2].id: {
        const { srcUrl } = info;
        chromeExtension.scripting.executeScript({
          target: { tabId: currentTab?.id as number },
          args: [{ html: `<img src=${srcUrl} />` }],
          func: args => {
            window._yuque_ext_app.addContentToClipAssistant(args.html, true);
          },
        });
        break;
      }
      default:
        break;
    }
  });
}
