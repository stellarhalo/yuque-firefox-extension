class Storage {
  async update(key: string, data: any) {
    const res = await chrome.storage.local.set({
      [key]: data,
    });
    return res;
  }

  async remove(key: string) {
    const res = await chrome.storage.local.remove(key);
    return res;
  }

  async get(key: string) {
    const valueMap = await chrome.storage.local.get(key);
    return valueMap[key];
  }
}

export const storage = new Storage();
