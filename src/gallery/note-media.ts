import { openMediaDatabase } from "./local-media";
import { createLocalId } from "./local-id";
import type { NoteAttachment } from "./types";
export const NOTE_MEDIA_LIMIT = 50 * 1024 * 1024;
export function validateNoteMedia(file: File) {
  if (!/^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|ogg))$/.test(file.type))
    throw new Error(
      "Unsupported file. Choose JPG, PNG, WebP, GIF, AVIF, MP4, WebM or Ogg. / نوع الملف غير مدعوم",
    );
  if (!file.size || file.size > NOTE_MEDIA_LIMIT)
    throw new Error(
      "Choose a non-empty file up to 50 MB. / اختر ملفًا غير فارغ لا يتجاوز 50 ميغابايت",
    );
}
export function storageMessage() {
  return "Could not save. Storage may be full or unavailable; your note is still here. / تعذر الحفظ؛ قد تكون مساحة التخزين ممتلئة أو غير متاحة. ملاحظتك ما زالت هنا.";
}
export async function saveNoteMedia(file: File): Promise<NoteAttachment> {
  validateNoteMedia(file);
  const attachment: NoteAttachment = {
    id: createLocalId(),
    kind: file.type.startsWith("image/") ? "image" : "video",
    name: file.name,
  };
  const db = await openMediaDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("noteMedia", "readwrite");
      tx.objectStore("noteMedia").put({ ...attachment, file });
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error(storageMessage()));
    });
  } finally {
    db.close();
  }
  return attachment;
}
export async function readNoteMedia(id: string): Promise<Blob | undefined> {
  const db = await openMediaDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("noteMedia");
      const req = tx.objectStore("noteMedia").get(id);
      tx.oncomplete = () => resolve(req.result?.file);
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function deleteNoteMedia(id: string) {
  const db = await openMediaDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("noteMedia", "readwrite");
      tx.objectStore("noteMedia").delete(id);
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
