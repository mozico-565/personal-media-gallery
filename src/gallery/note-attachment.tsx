import { useEffect, useState } from "react";
import { readNoteMedia } from "./note-media";
import type { NoteAttachment as Attachment } from "./types";
export function NoteAttachment({ attachment }: { attachment: Attachment }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    let url = "";
    setSrc("");
    setFailed(false);
    readNoteMedia(attachment.id)
      .then((blob) => {
        if (!alive) return;
        if (!blob) {
          setFailed(true);
          return;
        }
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [attachment.id]);
  return (
    <div className="note-attachment" onClick={(e) => e.stopPropagation()}>
      {failed ? (
        <p role="status" className="p-4 text-sm text-muted-foreground">
          Attachment unavailable / المرفق غير متاح
        </p>
      ) : src ? (
        attachment.kind === "image" ? (
          <img
            src={src}
            alt={attachment.name}
            onError={() => setFailed(true)}
            className="max-h-[420px] w-full object-contain"
          />
        ) : (
          <video
            src={src}
            aria-label={attachment.name}
            onError={() => setFailed(true)}
            controls
            muted
            playsInline
            preload="metadata"
            className="max-h-[420px] w-full"
          />
        )
      ) : (
        <p role="status" className="p-4 text-sm">
          Loading attachment / جار تحميل المرفق
        </p>
      )}
    </div>
  );
}
