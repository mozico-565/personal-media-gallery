import { createFileRoute } from "@tanstack/react-router";
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
      { title: "Social Gallery V2 — personal offline gallery prototype" },
      {
        name: "description",
        content:
          "Browse your personal gallery in Instagram, X and TikTok style views. Offline prototype with demo media.",
      },
      { property: "og:title", content: "Social Gallery V2" },
      {
        property: "og:description",
        content: "A personal offline gallery prototype with three social-style views.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-stage">
      <GalleryProvider>
        <Phone />
      </GalleryProvider>
    </div>
  );
}

function Phone() {
  const g = useGallery();
  const { mode, dark } = g.state;
  return (
    <div
      data-mode={mode}
      className={cn(
        "phone-frame relative overflow-hidden bg-background text-foreground",
        (mode !== "ig" || dark) && "dark",
      )}
    >
      {(["ig", "x", "tt"] as const).map((id) => (
        <div key={id} hidden={mode !== id} inert={mode !== id} className="h-full" data-mode={id}>
          {id === "ig" ? <InstagramMode /> : id === "x" ? <XMode /> : <TikTokMode />}
        </div>
      ))}
      {g.storageError && (
        <div
          role="alert"
          className="absolute inset-x-2 top-2 z-50 rounded-lg bg-destructive p-3 text-sm text-white"
        >
          {g.lang === "ar"
            ? "التخزين المحلي غير متاح. قد لا تُحفظ تغييراتك."
            : "Local storage unavailable. Changes may not persist."}
        </div>
      )}
      <PlatformSwitcher />
      <Toaster
        position="top-center"
        theme={mode !== "ig" || dark ? "dark" : "light"}
        dir={g.lang === "ar" ? "rtl" : "ltr"}
      />
    </div>
  );
}
