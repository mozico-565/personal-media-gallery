import "fake-indexeddb/auto";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { GalleryProvider, STORAGE_KEY, useGallery } from "@/gallery/store";
import { NoteComposer, XMode } from "@/gallery/x";
import { PlatformSwitcher } from "@/gallery/switcher";
import { readLocalMedia, saveLocalMedia } from "@/gallery/local-media";
import {
  deleteNoteMedia,
  NOTE_MEDIA_LIMIT,
  readNoteMedia,
  saveNoteMedia,
  validateNoteMedia,
} from "@/gallery/note-media";
const wrapper = ({ children }: { children: ReactNode }) => (
  <GalleryProvider>{children}</GalleryProvider>
);
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:v3-preview");
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("V3 note attachment transactions", () => {
  it("keeps photo/video attachments after remount without mixing gallery feeds", async () => {
    const first = renderHook(useGallery, { wrapper });
    const photo = await saveNoteMedia(new File(["pixels"], "note.png", { type: "image/png" }));
    const video = await saveNoteMedia(new File(["frames"], "note.mp4", { type: "video/mp4" }));
    act(() => {
      first.result.current.saveNote("صورة", undefined, undefined, photo);
      first.result.current.saveNote("فيديو", undefined, undefined, video);
    });
    const noteId = first.result.current.notes[1]!.id;
    act(() => first.result.current.saveNote("edited with attachment", noteId));
    first.unmount();
    const next = renderHook(useGallery, { wrapper });
    expect(next.result.current.notes.map((p) => p.attachment?.id)).toEqual([video.id, photo.id]);
    expect(await readNoteMedia(photo.id)).toBeDefined();
    expect(await readNoteMedia(video.id)).toBeDefined();
    expect(next.result.current.photoPosts.some((p) => p.id === photo.id)).toBe(false);
    expect(next.result.current.videoPosts.some((p) => p.id === video.id)).toBe(false);
    expect(JSON.stringify(next.result.current.notes)).not.toContain("blob:");
    act(() => next.result.current.deleteNote(noteId));
    await waitFor(async () => expect(await readNoteMedia(photo.id)).toBeUndefined());
    await deleteNoteMedia(video.id);
  });
  it("does not replace metadata or delete the old attachment after a quota failure", async () => {
    const { result } = renderHook(useGallery, { wrapper });
    const photo = await saveNoteMedia(new File(["old"], "old.jpg", { type: "image/jpeg" }));
    act(() => result.current.saveNote("old text", undefined, undefined, photo));
    const id = result.current.notes[0]!.id;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(() => result.current.saveNote("changed", id, undefined, null)).toThrow();
    expect(result.current.notes[0]!.caption.en).toBe("old text");
    expect(await readNoteMedia(photo.id)).toBeDefined();
    expect(() => result.current.deleteNote(id)).toThrow();
    expect(result.current.notes).toHaveLength(1);
    await deleteNoteMedia(photo.id);
  });
  it("rejects unsupported, empty and over-limit files", () => {
    expect(() => validateNoteMedia(new File(["x"], "bad.svg", { type: "image/svg+xml" }))).toThrow(
      /Unsupported/,
    );
    expect(() => validateNoteMedia(new File([], "empty.jpg", { type: "image/jpeg" }))).toThrow(
      /non-empty/,
    );
    const huge = new File(["x"], "huge.mp4", { type: "video/mp4" });
    Object.defineProperty(huge, "size", { value: NOTE_MEDIA_LIMIT + 1 });
    expect(() => validateNoteMedia(huge)).toThrow(/50 MB/);
  });
  it("previews, removes and replaces a single attachment before publishing", async () => {
    const view = render(<NoteComposer open onClose={vi.fn()} />, { wrapper });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Test attached note" } });
    const input = screen.getByLabelText("Note attachment / مرفق الملاحظة");
    fireEvent.change(input, {
      target: { files: [new File(["photo"], "first.png", { type: "image/png" })] },
    });
    await screen.findByAltText("first.png");
    fireEvent.click(screen.getByLabelText("Remove attachment / إزالة المرفق"));
    expect(screen.queryByAltText("first.png")).toBeNull();
    fireEvent.change(input, {
      target: { files: [new File(["video"], "second.mp4", { type: "video/mp4" })] },
    });
    expect(view.baseElement.querySelectorAll("video")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).notes[0].attachment.kind).toBe("video"),
    );
    const meta = JSON.parse(localStorage.getItem(STORAGE_KEY)!).notes[0].attachment;
    view.unmount();
    render(<XMode />, { wrapper });
    await waitFor(() => expect(screen.getByLabelText("second.mp4")).toBeInTheDocument());
    expect(screen.getByLabelText("second.mp4")).toHaveAttribute("controls");
    expect(screen.getByLabelText("second.mp4")).not.toHaveAttribute("autoplay");
    await deleteNoteMedia(meta.id);
  });
  it("upgrades media storage without removing existing imports", async () => {
    const added = await saveLocalMedia([
      new File(["original"], "gallery.jpg", { type: "image/jpeg" }),
    ]);
    const note = await saveNoteMedia(new File(["attached"], "note.webp", { type: "image/webp" }));
    expect((await readLocalMedia()).some((p) => p.id === added[0]!.id)).toBe(true);
    await deleteNoteMedia(note.id);
  });
});
describe("V3 platform switching and rapid reactions", () => {
  it("opens and closes from X five times, then switches all platforms without replacing notes", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: "x", lang: "ar", draft: "keep" }));
    render(<PlatformSwitcher />, { wrapper });
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: "تبديل الواجهة" }));
      expect(await screen.findByRole("button", { name: /ملاحظات/ })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Close / إغلاق" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
    for (const name of ["صور", "فيديوهات", "ملاحظات"]) {
      fireEvent.click(screen.getByRole("button", { name: "تبديل الواجهة" }));
      await screen.findByRole("dialog");
      fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).draft).toBe("keep");
  });
  it("handles fast like/save toggles and keeps final values on reload", () => {
    const first = renderHook(useGallery, { wrapper });
    act(() => {
      for (let i = 0; i < 11; i++) {
        first.result.current.toggle("liked", "p1");
        first.result.current.toggle("saved", "p1");
      }
    });
    first.unmount();
    const next = renderHook(useGallery, { wrapper });
    expect(next.result.current.state.liked["p1"]).toBe(true);
    expect(next.result.current.state.saved["p1"]).toBe(true);
  });
});

describe("V3 sheet lifetime", () => {
  it("closes via backdrop and restores focus without changing the saved mode", async () => {
    render(<PlatformSwitcher />, { wrapper });
    const trigger = screen.getByRole("button", { name: "Switch view" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("sheet-backdrop"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).mode).toBe("ig");
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("V3 existing database migration", () => {
  it("adds the note store to an actual v1 database while preserving imported bytes", async () => {
    const { IDBFactory } = await import("fake-indexeddb");
    const isolated = new IDBFactory();
    vi.stubGlobal("indexedDB", isolated);
    await new Promise<void>((resolve, reject) => {
      const request = isolated.open("social-gallery-media", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("media", { keyPath: "id" }).put({
          id: "legacy",
          file: new Blob(["legacy"]),
          name: "legacy.jpg",
          kind: "image",
          createdAt: 1,
        });
      };
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
    expect((await readLocalMedia()).map((p) => p.id)).toEqual(["legacy"]);
    const attached = await saveNoteMedia(new File(["new"], "new.png", { type: "image/png" }));
    expect(await readNoteMedia(attached.id)).toBeDefined();
    expect((await readLocalMedia()).map((p) => p.id)).toEqual(["legacy"]);
  });
});
