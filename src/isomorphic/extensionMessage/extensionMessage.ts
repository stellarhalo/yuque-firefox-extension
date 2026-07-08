import { getMsgId } from '@/isomorphic/util';
import Env from '@/isomorphic/env';
import { ExtensionMessageListener } from './interface';

class ExtensionMessage {
  static async sendToBackground(type: string, data: any, id?: string): Promise<any> {
    if (Env.isBackground) {
      throw new Error('sendToBackground not allowed in background');
    }
    const params = {
      type,
      data,
      id: id || getMsgId({ type }),
    };
    console.log('[FF] sendToBackground:', type, 'callbackFnId:', data?.callbackFnId);
    return new Promise(resolve => {
      chrome.runtime.sendMessage(params, (response: any) => {
        if (chrome.runtime.lastError) {
          console.error('[FF] sendToBackground lastError:', chrome.runtime.lastError.message);
          resolve(undefined);
          return;
        }
        console.log('[FF] sendToBackground got response for:', type);
        resolve(response);
      });
    });
  }

  static addListener(
    type: string | ExtensionMessageListener,
    fn: (data: any, id: string, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void,
  ) {
    const listener = (request: any, sender: chrome.runtime.MessageSender, sendResponse: (rest: any) => void) => {
      if (request.type === type) {
        fn(request.data, request.id, sender, sendResponse);
        return true;
      }
      return false;
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }

  static async sendToContent(tabId: number, type: string, data: any, id?: string) {
    if (!Env.isBackground) {
      throw new Error('sendToContent only allowed in background');
    }
    const params = {
      type,
      data,
      id: id || getMsgId({ type }),
    };
    chrome.tabs.sendMessage(tabId, params);
  }
}

export default ExtensionMessage;
