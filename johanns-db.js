/*
  Johann's Personal Space — shared local data layer.
  Include with: <script src="./johanns-db.js"></script>
  before each screen's own inline <script>.

  Provides window.JDB with:
    JDB.ready                          -> Promise, resolves once IndexedDB is open
    JDB.get(store, key)                -> Promise<value|undefined>
    JDB.put(store, key, value)         -> Promise<true>
    JDB.getAll(store)                  -> Promise<[{key, value}, ...]>
    JDB.delete(store, key)             -> Promise<true>
    JDB.compressImage(file, opts)      -> Promise<dataURL string>
    JDB.debounce(fn, delay)            -> debounced function (used for autosave)

  Stores: tasksByDay, budget, reminders, journalEntries, profile
  All data lives in the browser's IndexedDB — nothing is sent anywhere.
*/
(function () {
  const DB_NAME = "johanns-personal-space";
  const DB_VERSION = 2;
  const STORES = ["tasksByDay", "budget", "reminders", "journalEntries", "profile", "health", "images"];

  const dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported in this browser"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function get(storeName, key) {
    const db = await dbPromise;
    const tx = db.transaction(storeName, "readonly");
    return reqToPromise(tx.objectStore(storeName).get(key));
  }

  async function put(storeName, key, value) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAll(storeName) {
    const db = await dbPromise;
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const keys = await reqToPromise(store.getAllKeys());
    const vals = await reqToPromise(store.getAll());
    return keys.map((k, i) => ({ key: k, value: vals[i] }));
  }

  async function del(storeName, key) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // Resize + re-encode an image file in the browser before it ever touches
  // storage, so photo uploads (avatar, journal entries) stay small.
  function compressImage(file, opts = {}) {
    const { maxDim = 900, quality = 0.75, mimeType = "image/jpeg" } = opts;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        try {
          resolve(canvas.toDataURL(mimeType, quality));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    });
  }

  function debounce(fn, delay = 500) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  function compressImageBlob(file, opts = {}) {
    const { maxDim = 1400, quality = 0.78, mimeType = "image/webp" } = opts;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image compression failed")), mimeType, quality);
      };
      img.onerror = err => { URL.revokeObjectURL(objectUrl); reject(err); };
      img.src = objectUrl;
    });
  }

  window.JDB = {
    ready: dbPromise.then(() => true).catch(() => false),
    get,
    put,
    getAll,
    delete: del,
    compressImage,
    compressImageBlob,
    debounce,
  };
})();
