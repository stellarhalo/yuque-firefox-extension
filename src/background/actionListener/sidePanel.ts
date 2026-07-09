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
