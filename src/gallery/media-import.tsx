import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useGallery } from "./store";
export function MediaImport({
  kind,
  className,
  children,
}: {
  kind: "image" | "video";
  className?: string;
  children: ReactNode;
}) {
  const g = useGallery();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        disabled={busy}
        aria-label={g.lang === "ar" ? "إضافة من الجهاز" : "Add from device"}
        onClick={() => ref.current?.click()}
        className={className}
      >
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={`${kind}/*`}
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            await g.importMedia(files);
            toast(
              g.lang === "ar"
                ? "حُفظت الملفات محليًا على هذا الجهاز"
                : "Saved locally on this device",
            );
          } catch {
            toast.error(
              g.lang === "ar"
                ? "تعذر الحفظ. تحقق من نوع الملف ومساحة التخزين."
                : "Could not save. Check file type and available storage.",
            );
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
