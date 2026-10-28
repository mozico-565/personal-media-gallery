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
import { GalleryProvider, STORAGE_KEY, useGallery } from "@/gallery/store";
import { XMode } from "@/gallery/x";
import { InstagramMode } from "@/gallery/instagram";
import { TikTokMode } from "@/gallery/tiktok";
import { readLocalMedia, saveLocalMedia } from "@/gallery/local-media";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <GalleryProvider>{children}</GalleryProvider>
);
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  URL.createObjectURL = vi.fn(() => "blob:local-test");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Content separation and saved data", () => {
  it("exposes only photos in Instagram and only videos in TikTok, starting X without media posts", () => {
    const { result } = renderHook(useGallery, { wrapper });
    expect(result.current.photoPosts.length).toBeGreaterThan(0);
    expect(result.current.photoPosts.every((p) => p.media.every((m) => m.kind === "image"))).toBe(
      true,
    );
    expect(result.current.videoPosts.every((p) => p.media.every((m) => m.kind === "video"))).toBe(
      true,
    );
    expect(result.current.notes).toEqual([]);
  });
  it("preserves v1 interactions while adding note defaults", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ liked: { p1: true }, saved: { p2: true }, lang: "ar" }),
    );
    const { result } = renderHook(useGallery, { wrapper });
    expect(result.current.state.liked["p1"]).toBe(true);
    expect(result.current.state.saved["p2"]).toBe(true);
    expect(result.current.notes).toEqual([]);
    expect(document.documentElement.dir).toBe("rtl");
  });
  it("creates, edits, quotes, replies, deletes and reloads notes and drafts", () => {
    const first = renderHook(useGallery, { wrapper });
    act(() => first.result.current.saveNote("ملاحظة أولى"));
    const id = first.result.current.notes[0]!.id;
    act(() => first.result.current.saveNote("edited", id));
    act(() => first.result.current.saveNote("quoted", undefined, id));
    act(() => first.result.current.addComment(id, "reply"));
    act(() => first.result.current.set("draft", "unfinished"));
    first.unmount();
    const next = renderHook(useGallery, { wrapper });
    expect(next.result.current.notes).toHaveLength(2);
    expect(next.result.current.notes[0]!.quoteId).toBe(id);
    expect(next.result.current.notes[1]!.caption.en).toBe("edited");
    expect(next.result.current.commentsFor(id)).toHaveLength(1);
    expect(next.result.current.state.draft).toBe("unfinished");
    act(() => next.result.current.deleteNote(id));
    expect(next.result.current.notes).toHaveLength(1);
    expect(next.result.current.commentsFor(id)).toEqual([]);
  });
  it("handles corrupt persisted fields without crashing", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ notes: null, comments: null, liked: null, mode: "bad" }),
    );
    const { result } = renderHook(useGallery, { wrapper });
    expect(result.current.notes).toEqual([]);
    expect(result.current.state.liked).toEqual({});
    expect(result.current.state.mode).toBe("ig");
  });
});

describe("Real UI interactions", () => {
  it("composes and edits text notes without rendering media, keeping a draft on close", async () => {
    render(<XMode />, { wrapper });
    fireEvent.click(screen.getByLabelText("compose"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "My private note" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    expect(screen.getByText("My private note")).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Note options" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Note options" })).toBeNull());
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Edited note" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    expect(screen.getByText("Edited note")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("compose"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByLabelText("compose"));
    expect(screen.getByRole("textbox")).toHaveValue("Draft");
  });
  it("can delete an open note thread safely", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        notes: [
          {
            id: "note",
            authorId: "me",
            caption: { en: "Thread note", ar: "Thread note" },
            media: [],
            createdAt: Date.now(),
            baseLikes: 0,
            baseReposts: 0,
            views: 0,
          },
        ],
      }),
    );
    render(<XMode />, { wrapper });
    fireEvent.click(screen.getByText("Thread note"));
    fireEvent.click(screen.getByRole("button", { name: "Note options" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Note deleted")).toBeInTheDocument();
  });
  it("closes note sheets with Escape and restores compose focus", async () => {
    render(<XMode />, { wrapper });
    const compose = screen.getByLabelText("compose");
    compose.focus();
    fireEvent.click(compose);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(compose).toHaveFocus();
  });
  it("renders no video in Instagram and no photo slide in TikTok", () => {
    const ig = render(<InstagramMode />, { wrapper });
    expect(ig.container.querySelector("video")).toBeNull();
    ig.unmount();
    const tt = render(<TikTokMode />, { wrapper });
    const slides = tt.container.querySelectorAll("section");
    expect(slides.length).toBeGreaterThan(0);
    slides.forEach((slide) => expect(slide.querySelector("video")).not.toBeNull());
  });
  it("allows comment CRUD and persists likes and saves", () => {
    const { result } = renderHook(useGallery, { wrapper });
    act(() => {
      result.current.toggle("liked", "p1");
      result.current.toggle("saved", "p1");
      result.current.addComment("p1", "test");
    });
    const c = result.current.commentsFor("p1").find((c) => c.text === "test")!;
    act(() => result.current.editComment(c.id, "updated"));
    expect(result.current.commentsFor("p1").find((x) => x.id === c.id)?.text).toBe("updated");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).liked.p1).toBe(true);
    act(() => result.current.deleteComment(c.id));
    expect(result.current.commentsFor("p1").some((x) => x.id === c.id)).toBe(false);
  });
});

describe("Local media storage", () => {
  it("stores imported files in IndexedDB and restores their media types", async () => {
    const files = [
      new File(["image"], "mine.png", { type: "image/png" }),
      new File(["video"], "mine.mp4", { type: "video/mp4" }),
    ];
    const added = await saveLocalMedia(files);
    expect(added.map((p) => p.media[0]!.kind)).toEqual(["image", "video"]);
    const restored = await readLocalMedia();
    expect(restored.filter((p) => added.some((a) => a.id === p.id))).toHaveLength(2);
    expect(restored.every((p) => p.media[0]!.source === "device")).toBe(true);
    await expect(
      saveLocalMedia([new File(["txt"], "no.txt", { type: "text/plain" })]),
    ).rejects.toThrow();
  });
  it("reports a storage failure rather than losing updates silently", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const { result } = renderHook(useGallery, { wrapper });
    await waitFor(() => expect(result.current.storageError).toBe(true));
  });
});
