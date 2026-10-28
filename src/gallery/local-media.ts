import { createLocalId } from "./local-id";
import type { Post } from "./types";

type Entry = { id: string; file: Blob; name: string; kind: "image" | "video"; createdAt: number };
const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("social-gallery-media", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("media", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const toPost = (e: Entry): Post => ({
  id: e.id,
  authorId: "me",
  caption: { en: e.name, ar: e.name },
  createdAt: e.createdAt,
  baseLikes: 0,
  baseReposts: 0,
  views: 0,
  media: [
    {
      id: e.id,
      src: URL.createObjectURL(e.file),
      kind: e.kind,
      width: 1080,
      height: 1440,
      source: "device",
    },
  ],
});
export async function readLocalMedia(): Promise<Post[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("media");
    const req = tx.objectStore("media").getAll();
    tx.oncomplete = () => {
      db.close();
      resolve((req.result as Entry[]).sort((a, b) => b.createdAt - a.createdAt).map(toPost));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function saveLocalMedia(files: File[]): Promise<Post[]> {
  if (!files.length) return [];
  if (files.some((f) => !/^(image|video)\//.test(f.type)))
    throw new Error("Choose images or videos / اختر صورًا أو فيديوهات");
  const entries: Entry[] = files.map((file) => ({
    id: createLocalId(),
    file,
    name: file.name,
    kind: file.type.startsWith("image/") ? "image" : "video",
    createdAt: Date.now(),
  }));
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("media", "readwrite");
    entries.forEach((e) => tx.objectStore("media").put(e));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
  return entries.map(toPost);
}
