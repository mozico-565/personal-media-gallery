import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { InstagramMode } from "@/gallery/instagram";
import { GalleryProvider, useGallery } from "@/gallery/store";
import { PlatformSwitcher } from "@/gallery/switcher";
import { TikTokMode } from "@/gallery/tiktok";
import { XMode } from "@/gallery/x";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Social Gallery V1 — personal offline gallery prototype" },
      { name: "description", content: "Browse your personal gallery in Instagram, X and TikTok style views. Offline prototype with demo media." },
      { property: "og:title", content: "Social Gallery V1" },
      { property: "og:description", content: "A personal offline gallery prototype with three social-style views." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const hydrated = useHydrated();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-stage">
      {hydrated ? <GalleryProvider><Phone /></GalleryProvider> : <div className="phone-frame bg-media" />}
    </div>
  );
}

function Phone() {
  const g = useGallery();
  const { mode, dark } = g.state;
  return (
    <div data-mode={mode} className={cn("phone-frame relative overflow-hidden bg-background text-foreground", (mode !== "ig" || dark) && "dark")}>
      <div key={mode} className="h-full animate-in fade-in zoom-in-[0.98] duration-300">
        {mode === "ig" ? <InstagramMode /> : mode === "x" ? <XMode /> : <TikTokMode />}
      </div>
      <PlatformSwitcher />
      <Toaster position="top-center" theme={mode !== "ig" || dark ? "dark" : "light"} dir={g.lang === "ar" ? "rtl" : "ltr"} />
    </div>
  );
}
