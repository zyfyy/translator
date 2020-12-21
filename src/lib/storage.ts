export class ChromeStorage <T> {
  key: string;

  constructor(key: string) {
    this.key = key;
  }

  async _getRootStorage(): Promise<typeof chrome.storage> {
    if (chrome.storage) {
      return Promise.resolve(chrome.storage);
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (chrome.storage) {
            resolve(chrome.storage);
          } else {
            reject(new Error('等待后，依旧没有获取到chrome.storage'));
          }
        }, 1000);
      });
    }
  }

  async get(): Promise<T> {
    return new Promise(async (resolve) => {
      const storage = await this._getRootStorage();
      storage.local.get(this.key, (obj) => {
        resolve(obj[this.key]);
      });
    });
  }

  async set(value: T): Promise<void> {
    return new Promise(async (resolve) => {
      const storage = await this._getRootStorage();
      storage.local.set({ [this.key]: value }, () => {
        resolve();
      });
    });
  }

  async watch(cb: Function) {
    const storage = await this._getRootStorage();
    storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[this.key]) {
        cb(changes[this.key]);
      }
    });
  }
}

