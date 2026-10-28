import { describe, expect, it, vi } from "vitest";
import { createLocalId } from "@/gallery/local-id";
describe("HTTP development compatibility", () => {
  it("creates distinct IDs when randomUUID is unavailable", () => {
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new Error("should not call");
    });
    const original = Object.getOwnPropertyDescriptor(crypto, "randomUUID");
    Object.defineProperty(crypto, "randomUUID", { configurable: true, value: undefined });
    try {
      const first = createLocalId();
      expect(first).toMatch(/^[a-f0-9]{32}$/);
      expect(createLocalId()).not.toBe(first);
    } finally {
      if (original) Object.defineProperty(crypto, "randomUUID", original);
      vi.restoreAllMocks();
    }
  });
});
