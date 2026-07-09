declare interface Window {
  __i18n: (text: string, params?: any) => string;
  _yuque_ext_app: any;
}

// Firefox browser API 类型声明
declare namespace browser {
  namespace runtime {
    function getURL(path: string): string;
    function sendMessage(message: any): Promise<any>;
    function getManifest(): chrome.runtime.Manifest;
  }
  namespace tabs {
    function query(queryInfo: object): Promise<chrome.tabs.Tab[]>;
    function sendMessage(tabId: number, message: any): Promise<any>;
  }
  namespace storage {
    namespace local {
      function get(keys: string | string[]): Promise<{ [key: string]: any }>;
      function set(items: { [key: string]: any }): Promise<void>;
    }
  }
  namespace cookies {
    function getAll(queryInfo: object): Promise<chrome.cookies.Cookie[]>;
    function get(queryInfo: object): Promise<chrome.cookies.Cookie | null>;
  }
  namespace contextMenus {
    function create(createProperties: object): void;
    const onClicked: {
      addListener(callback: (info: any, tab: any) => void): void;
    };
  }
  namespace action {
    const onClicked: {
      addListener(callback: (tab: any) => void): void;
    };
  }
  namespace browserAction {
    const onClicked: {
      addListener(callback: (tab: any) => void): void;
    };
  }
  namespace scripting {
    function executeScript(details: object): Promise<any>;
  }
  namespace commands {
    const onCommand: {
      addListener(callback: (command: string, tab?: any) => void): void;
    };
  }
}

declare module '*.less' {
  const resource: { [key: string]: string };
  export = resource;
}

declare module '*.png'
declare module '*.jpg'

declare module '*.svg' {
  export default string;
  export const ReactComponent = React.Component;
}

declare function __i18n(text: string, params?: any): string;

declare module 'easy-i18n-cli/src/locale' {
  interface LocaleOptions {
    en: Record<string, string>;
    useEn: () => boolean;
  }
  function locale(options: LocaleOptions): (text: string, params?: {[key: string]: string}) => string;
  export default locale;
}

declare module 'uuid' {
  export function v4(): string;
}
