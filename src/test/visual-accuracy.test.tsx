import "fake-indexeddb/auto";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { GalleryProvider, STORAGE_KEY, useGallery } from "@/gallery/store";
import { InstagramMode } from "@/gallery/instagram";
import { TikTokMode } from "@/gallery/tiktok";
import { XMode } from "@/gallery/x";
import { XAccentSettings } from "@/gallery/switcher";
import { videoFit } from "@/gallery/media-layout";
import { accentForeground, DEFAULT_X_ACCENT } from "@/gallery/x-accent";
import { saveNoteMedia, deleteNoteMedia } from "@/gallery/note-media";

const wrapper = ({ children }: { children: ReactNode }) => (
  <GalleryProvider>{children}</GalleryProvider>
);
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:accuracy-fixture");
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("X arbitrary accent preferences", () => {
  it("restores legacy notes and reactions while defaulting missing or invalid colors", () => {
    for (const xAccent of [undefined, "url(unsafe)", "#abc", null]) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ xAccent, draft: "keep draft", liked: { old: true }, notes: [] }),
      );
      const view = renderHook(useGallery, { wrapper });
      expect(view.result.current.state.xAccent).toBe(DEFAULT_X_ACCENT);
      expect(view.result.current.state.draft).toBe("keep draft");
      expect(view.result.current.state.liked["old"]).toBe(true);
      view.unmount();
    }
  });
  it("chooses an arbitrary custom color, persists after remount, and restores orange without resetting notes", () => {
    const setup = renderHook(useGallery, { wrapper });
    act(() => setup.result.current.saveNote("keep my note"));
    setup.unmount();
    const view = render(
      <>
        <XAccentSettings />
        <XMode />
      </>,
      { wrapper },
    );
    fireEvent.change(screen.getByLabelText("X accent color"), { target: { value: "#123abc" } });
    expect(
      view.container.querySelector<HTMLElement>(".x-type")!.style.getPropertyValue("--x-accent"),
    ).toBe("#123abc");
    view.unmount();
    render(<XAccentSettings />, { wrapper });
    expect(screen.getByLabelText("X accent color")).toHaveValue("#123abc");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).notes[0].caption.en).toBe("keep my note");
    fireEvent.click(screen.getByRole("button", { name: "Restore orange" }));
    expect(screen.getByLabelText("X accent color")).toHaveValue(DEFAULT_X_ACCENT);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).notes).toHaveLength(1);
  });
  it("accepts a full HEX code and ignores an incomplete one without losing the saved color", () => {
    render(<XAccentSettings />, { wrapper });
    const field = screen.getByLabelText("X HEX color");
    fireEvent.change(field, { target: { value: "#1" } });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).xAccent).toBe(DEFAULT_X_ACCENT);
    fireEvent.change(field, { target: { value: "#12abEF" } });
    expect(field).toHaveAttribute("aria-invalid", "false");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).xAccent).toBe("#12abef");
    fireEvent.click(screen.getByRole("button", { name: "X #ffffff" }));
    expect(field).toHaveValue("#ffffff");
  });
  it("keeps text legible on light and dark custom buttons", () => {
    expect(accentForeground("#ffffff")).toBe("#000000");
    expect(accentForeground("#ffff00")).toBe("#000000");
    expect(accentForeground("#000000")).toBe("#ffffff");
    expect(accentForeground("#123abc")).toBe("#ffffff");
  });
});

describe("reference layouts preserve real behavior", () => {
  it("renders one composite attachment as one image, filters real notes, and expands text without changing stored content", async () => {
    const meta = await saveNoteMedia(
      new File(["composite"], "one-composite.jpg", { type: "image/jpeg" }),
    );
    const setup = renderHook(useGallery, { wrapper });
    const long = "Arabic العربية with Latin text.\n".repeat(30);
    act(() => {
      setup.result.current.saveNote(long, undefined, undefined, meta);
      setup.result.current.saveNote("Only text");
    });
    setup.unmount();
    const view = render(<XMode />, { wrapper });
    expect(await screen.findByRole("img", { name: "one-composite.jpg" })).toBeInTheDocument();
    expect(view.container.querySelectorAll(".note-attachment img")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(view.container.querySelector(".note-text:not(.note-collapsed)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Media" }));
    expect(view.container.querySelectorAll("article")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(screen.getByText("Only text")).toBeInTheDocument();
    expect(view.container.querySelector(".note-attachment")).toBeNull();
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(data.notes.find((p: { attachment?: unknown }) => p.attachment).caption.en).toBe(
      long.trim(),
    );
    await deleteNoteMedia(meta.id);
  });
  it("likes an Instagram photo at the double tap point, but does not like it after dragging", () => {
    const view = render(<InstagramMode />, { wrapper });
    const article = view.container.querySelector("article")!;
    const media = article.querySelector<HTMLElement>(".ig-media > div")!;
    vi.spyOn(media, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 360,
      height: 480,
    } as DOMRect);
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    const tap = () => {
      fireEvent.pointerDown(media, { clientX: 144, clientY: 240 });
      fireEvent.click(media, { clientX: 144, clientY: 240 });
    };
    tap();
    now.mockReturnValue(1100);
    tap();
    expect(within(article).getByRole("button", { name: "like" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(article.querySelector<HTMLElement>(".ig-burst")!.style.left).toBe("40%");
    fireEvent.click(within(article).getByRole("button", { name: "like" }));
    expect(within(article).getByRole("button", { name: "like" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    now.mockReturnValue(2000);
    tap();
    now.mockReturnValue(2100);
    fireEvent.pointerDown(media, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(media, { clientX: 180, clientY: 130 });
    fireEvent.click(media, { clientX: 180, clientY: 130 });
    expect(within(article).getByRole("button", { name: "like" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
  it("advances a real photo carousel and retains the save/repost actions", () => {
    const view = render(<InstagramMode />, { wrapper });
    const article = view.container.querySelector("article")!;
    const media = article.querySelector<HTMLElement>(".ig-media > div")!;
    Object.defineProperty(media, "clientWidth", { value: 360 });
    media.scrollLeft = -360;
    fireEvent.scroll(media);
    expect(within(article).getByText("2/2")).toBeInTheDocument();
    fireEvent.click(within(article).getByRole("button", { name: "save" }));
    expect(within(article).getByRole("button", { name: "save" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(within(article).getByRole("button", { name: "Reposts" }));
    expect(within(article).getByRole("button", { name: "Reposts" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("searches local videos and preserves the friends following filter", async () => {
    const view = render(<TikTokMode />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "nightwalks" },
    });
    await waitFor(() => expect(view.container.querySelectorAll("main section")).toHaveLength(1));
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "not-found-at-all" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("No videos");
    fireEvent.click(screen.getByRole("button", { name: "Friends" }));
    expect(view.container.querySelectorAll("main section")).toHaveLength(1);
    expect(view.container.querySelector("main section")!.textContent).toContain("Coastline Roll");
  });
});

describe("video framing by real dimensions", () => {
  it("letterboxes landscape and very tall video while filling an almost matching portrait", () => {
    expect(videoFit(1920, 1080, 359, 682)).toBe("contain");
    expect(videoFit(720, 1900, 393, 821)).toBe("contain");
    expect(videoFit(1080, 1920, 393, 710)).toBe("cover");
    expect(videoFit(0, 0, 393, 710)).toBe("contain");
  });
});
