// Small IndexedDB wrapper so audio files survive a page refresh.
// (localStorage is too small for audio, IndexedDB can hold large files.)
const DB_NAME = "playlist-audio";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Generic helper: T is the type of the value the request produces.
async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const saveAudio = (id: string, file: Blob) => run("readwrite", (s) => s.put(file, id));
export const deleteAudio = (id: string) => run("readwrite", (s) => s.delete(id));

export async function loadAllAudio(): Promise<Record<string, Blob>> {
  const keys = await run<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
  const blobs = await run<Blob[]>("readonly", (s) => s.getAll());
  const result: Record<string, Blob> = {};
  keys.forEach((key, i) => {
    result[String(key)] = blobs[i];
  });
  return result;
}
