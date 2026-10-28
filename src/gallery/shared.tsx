import { useEffect, useRef, useState, useId, type ReactNode } from "react";
import {
  BadgeCheck,
  Bookmark,
  Heart,
  MessageCircle,
  MessageCircleMore,
  Music2,
  Plus,
  Send,
  Forward,
  Volume2,
  VolumeX,
  X,
  Play,
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtCount, timeAgo } from "./i18n";
import { ME, useGallery } from "./store";
import type { Comment, MediaItem, Post, Profile } from "./types";
import { videoFit } from "./media-layout";

export function Avatar({
  p,
  size = 32,
  ring,
  seen,
  className,
}: {
  p: Profile;
  size?: number;
  ring?: boolean;
  seen?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full",
        ring && (seen ? "bg-border p-[1.5px]" : "bg-story-ring p-[2px]"),
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={p.avatar}
        alt=""
        className={cn(
          "h-full w-full rounded-full object-cover",
          ring && "border-2 border-background",
        )}
      />
    </span>
  );
}

export function Verified({ className }: { className?: string }) {
  return (
    <BadgeCheck
      aria-label="verified"
      className={cn("inline size-[1em] fill-primary text-primary-foreground", className)}
    />
  );
}

export function DemoChip({ className }: { className?: string }) {
  const { t } = useGallery();
  return (
    <span
      className={cn(
        "rounded-sm bg-overlay px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-media-foreground",
        className,
      )}
    >
      {t("demo")}
    </span>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [mounted, setMounted] = useState(open);
  const close = useRef(onClose);
  close.current = onClose;
  const dismiss = () => close.current();
  const visible = open || mounted;
  // Keep controlled sheets present until exit finishes. Reopening cancels cleanup.
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
    const timer = setTimeout(() => setMounted(false), delay);
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!visible) return;
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab" && el) {
        const items = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not([hidden]), textarea, [tabindex="0"]',
          ),
        ).filter((x) => x.offsetParent !== null);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || document.activeElement === el)
        ) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    el?.addEventListener("keydown", key);
    return () => {
      el?.removeEventListener("keydown", key);
      if (document.activeElement === document.body || el?.contains(document.activeElement))
        previous?.focus({ preventScroll: true });
    };
  }, [visible]);
  const start = useRef(0);
  if (!visible) return null;
  return createPortal(
    <div
      className="sheet-layer absolute inset-0 z-40"
      data-exiting={!open}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        data-testid="sheet-backdrop"
        onClick={dismiss}
        className="sheet-backdrop absolute inset-0 bg-overlay"
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cn(
          "sheet-panel absolute inset-x-0 bottom-0 flex max-h-[90%] flex-col rounded-t-2xl bg-sheet text-sheet-foreground pb-safe shadow-sheet outline-none",
          className,
        )}
      >
        <div
          onTouchStart={(e) => {
            start.current = e.touches[0]!.clientY;
          }}
          onTouchEnd={(e) => {
            if (e.changedTouches[0]!.clientY - start.current > 70) dismiss();
          }}
          className="flex min-h-6 items-center justify-center"
        >
          <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
        </div>
        <div className="relative shrink-0 border-b border-border px-12 pb-3 text-center text-[15px] font-semibold">
          <span id={id}>{title}</span>
          <button
            aria-label="Close / إغلاق"
            onClick={dismiss}
            className="absolute end-2 top-0 flex size-9 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.querySelector(".phone-frame") ?? document.body,
  );
}

/** Comments with full CRUD for the owner's comments; used by Instagram and TikTok styles. */
export function CommentsPanel({ postId }: { postId: string | null }) {
  const g = useGallery();
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setText("");
    setEditing(null);
    setReplyTo(null);
  }, [postId]);
  if (!postId) return <div className="h-40" />;
  const list = g.commentsFor(postId);
  const top = list.filter((c) => !c.parentId);
  const submit = () => {
    if (!text.trim()) return;
    if (editing) g.editComment(editing, text);
    else g.addComment(postId, text, replyTo?.id ?? null);
    setText("");
    setEditing(null);
    setReplyTo(null);
  };
  const Row = ({ c, nested }: { c: Comment; nested?: boolean }) => {
    const a = g.profile(c.authorId);
    const liked = g.state.likedComments[c.id];
    return (
      <div className={cn("flex gap-3 py-2.5", nested && "ps-11")}>
        <Avatar p={a} size={nested ? 24 : 32} />
        <div className="min-w-0 flex-1 text-[13.5px] leading-snug">
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <span className="font-semibold">{a.handle}</span>
            <span className="text-muted-foreground">
              {timeAgo(c.createdAt, g.lang)}
              {c.edited && ` · ${g.t("edited")}`}
            </span>
          </div>
          <p className="mt-0.5 break-words">{c.text}</p>
          <div className="mt-1 flex gap-4 text-[12px] font-semibold text-muted-foreground">
            <button
              onClick={() => {
                setReplyTo(nested ? (list.find((x) => x.id === c.parentId) ?? c) : c);
                setEditing(null);
                inputRef.current?.focus();
              }}
            >
              {g.t("reply")}
            </button>
            {c.authorId === ME && (
              <>
                <button
                  onClick={() => {
                    setEditing(c.id);
                    setReplyTo(null);
                    setText(c.text);
                    inputRef.current?.focus();
                  }}
                >
                  {g.t("edit")}
                </button>
                <button
                  className="text-destructive"
                  onClick={() => {
                    g.deleteComment(c.id);
                    toast(g.t("commentDeleted"));
                  }}
                >
                  {g.t("delete")}
                </button>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => g.toggle("likedComments", c.id)}
          className="flex flex-col items-center pt-1 text-muted-foreground"
          aria-label="like comment"
        >
          <Heart className={cn("size-3.5", liked && "fill-like text-like")} />
          <span className="text-[11px]">{g.commentLikes(c) || ""}</span>
        </button>
      </div>
    );
  };
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 no-scrollbar">
        {top.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">{g.t("noComments")}</p>
        )}
        {top.map((c) => (
          <div key={c.id}>
            <Row c={c} />
            {list
              .filter((r) => r.parentId === c.id)
              .map((r) => (
                <Row key={r.id} c={r} nested />
              ))}
          </div>
        ))}
      </div>
      {(replyTo || editing) && (
        <div className="flex items-center justify-between bg-muted px-4 py-2 text-xs text-muted-foreground">
          <span>
            {editing
              ? g.t("editedLabel")
              : `${g.t("replyingTo")} @${g.profile(replyTo!.authorId).handle}`}
          </span>
          <button
            onClick={() => {
              setReplyTo(null);
              setEditing(null);
              setText("");
            }}
          >
            {g.t("cancel")}
          </button>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-3 border-t border-border px-4 py-2.5"
      >
        <Avatar p={g.profile(ME)} size={32} />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={g.t("addComment")}
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
        />
        <button
          disabled={!text.trim()}
          className="text-[14px] font-semibold text-primary disabled:opacity-40"
        >
          {editing ? g.t("save") : g.t("post")}
        </button>
      </form>
    </>
  );
}

export function LikesList({ postId }: { postId: string | null }) {
  const g = useGallery();
  if (!postId) return null;
  const people = g.profiles.filter((p) => !p.isMe || g.state.liked[postId]);
  return (
    <div className="overflow-y-auto px-4 py-2">
      {people.map((p) => (
        <div key={p.id} className="flex items-center gap-3 py-2">
          <Avatar p={p} size={44} />
          <div className="flex-1 text-sm">
            <div className="font-semibold">{p.handle}</div>
            <div className="text-muted-foreground">{p.name[g.lang]}</div>
          </div>
          {!p.isMe && <FollowButton id={p.id} />}
        </div>
      ))}
    </div>
  );
}

export function FollowButton({
  id,
  className,
  variant = "ig",
}: {
  id: string;
  className?: string;
  variant?: "ig" | "x" | "tt";
}) {
  const g = useGallery();
  const on = !!g.state.following[id];
  const styles = {
    ig: on
      ? "bg-secondary text-secondary-foreground rounded-lg"
      : "bg-primary text-primary-foreground rounded-lg",
    x: on
      ? "border border-border bg-transparent text-foreground rounded-full"
      : "bg-foreground text-background rounded-full",
    tt: on
      ? "bg-secondary text-secondary-foreground rounded-md"
      : "bg-primary text-primary-foreground rounded-md",
  }[variant];
  return (
    <button
      onClick={() => g.toggle("following", id)}
      className={cn(
        "px-4 py-1.5 text-[13.5px] font-semibold transition-colors active:scale-95",
        styles,
        className,
      )}
    >
      {on ? g.t("followingBtn") : g.t("follow")}
    </button>
  );
}

/** Image or (muted, autoplay-when-active) video. */
export function MediaView({
  m,
  active = true,
  className,
  muted = true,
  paused,
  smartFit = false,
}: {
  m: MediaItem;
  active?: boolean;
  className?: string;
  muted?: boolean;
  paused?: boolean;
  smartFit?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState({
    width: m.width,
    height: m.height,
    boxWidth: 0,
    boxHeight: 0,
  });
  useEffect(() => {
    const el = box.current;
    if (!smartFit || !el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setGeometry((g) => ({
          ...g,
          boxWidth: entry.contentRect.width,
          boxHeight: entry.contentRect.height,
        }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [smartFit, m.src]);
  const [error, setError] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const { lang, state } = useGallery();
  const visibleMode = state.mode === "tt";
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const update = () => {
      if (active && visibleMode && !paused && !document.hidden)
        v.play()
          .then(() => setBlocked(false))
          .catch(() => setBlocked(true));
      else v.pause();
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      v.pause();
    };
  }, [active, visibleMode, paused, m.src]);
  if (error)
    return (
      <div
        role="status"
        className="flex h-full items-center justify-center bg-media p-6 text-center text-sm text-media-foreground"
      >
        {lang === "ar"
          ? "الملف غير متاح أو تنسيقه غير مدعوم"
          : "Media unavailable or unsupported format"}
      </div>
    );
  if (m.kind === "video")
    return (
      <div ref={box} className="relative h-full w-full">
        <video
          ref={ref}
          src={m.src}
          poster={m.poster}
          muted={muted}
          loop
          playsInline
          preload={active ? "metadata" : "none"}
          onLoadedMetadata={(e) => {
            const { videoWidth: width, videoHeight: height } = e.currentTarget;
            setGeometry((g) => ({ ...g, width, height }));
          }}
          onError={() => setError(true)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
          }}
          className={cn("h-full w-full object-cover", className)}
          style={
            smartFit
              ? {
                  objectFit: videoFit(
                    geometry.width,
                    geometry.height,
                    geometry.boxWidth,
                    geometry.boxHeight,
                  ),
                }
              : undefined
          }
        />
        {blocked && active && (
          <button
            aria-label={lang === "ar" ? "تشغيل الفيديو" : "Play video"}
            onClick={(e) => {
              e.stopPropagation();
              ref.current
                ?.play()
                .then(() => setBlocked(false))
                .catch(() => setError(true));
            }}
            className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-overlay text-white"
          >
            <Play />
          </button>
        )}
        <input
          aria-label={lang === "ar" ? "تقدم الفيديو" : "Video progress"}
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = ref.current;
            if (v && Number.isFinite(v.duration)) {
              v.currentTime = (Number(e.target.value) / 100) * v.duration;
              setProgress(Number(e.target.value));
            }
          }}
          className="absolute inset-x-0 bottom-0 z-10 h-5 w-full accent-white"
        />
      </div>
    );
  return (
    <img
      src={m.src}
      alt={lang === "ar" ? "صورة من المعرض" : "Gallery photo"}
      onError={() => setError(true)}
      draggable={false}
      loading="lazy"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

/** Fullscreen vertical swipe feed (TikTok home + Instagram Reels). */
export function VerticalFeed({
  posts,
  variant,
  onComments,
  onProfile,
  initialIndex = 0,
}: {
  posts: Post[];
  variant: "ig" | "tt";
  onComments: (id: string) => void;
  onProfile: (id: string) => void;
  initialIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const firstPostId = posts[0]?.id;
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = initialIndex * el.clientHeight;
  }, [initialIndex, firstPostId]);
  return (
    <div
      ref={ref}
      className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain no-scrollbar bg-media"
      data-surface="media"
      tabIndex={0}
      role="region"
      aria-label={variant === "tt" ? "Video feed / الفيديوهات" : "Photo feed / الصور"}
      style={{ overflowAnchor: "none" }}
    >
      {!posts.length && (
        <p
          role="status"
          className="flex h-full items-center justify-center p-8 text-center text-muted-foreground"
        >
          {variant === "tt" ? "No videos here / لا توجد فيديوهات هنا" : "No photos / لا توجد صور"}
        </p>
      )}
      {posts.map((p) => (
        <Slide
          key={p.id}
          post={p}
          variant={variant}
          muted={muted}
          setMuted={setMuted}
          onComments={onComments}
          onProfile={onProfile}
        />
      ))}
    </div>
  );
}

function Slide({
  post,
  variant,
  muted,
  setMuted,
  onComments,
  onProfile,
}: {
  post: Post;
  variant: "ig" | "tt";
  muted: boolean;
  setMuted: (m: boolean) => void;
  onComments: (id: string) => void;
  onProfile: (id: string) => void;
}) {
  const g = useGallery();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [idx, setIdx] = useState(0);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const touchStart = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(tapTimer.current), []);
  const author = g.profile(post.authorId);
  const liked = !!g.state.liked[post.id];
  const saved = !!g.state.saved[post.id];
  const hasVideo = post.media.some((m) => m.kind === "video");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setActive(!!e?.isIntersecting && e.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onTap = () => {
    if (moved.current) {
      lastTap.current = 0;
      return;
    }
    const now = Date.now();
    clearTimeout(tapTimer.current);
    if (now - lastTap.current < 280) {
      g.toggle("liked", post.id, true);
      setBurst((b) => b + 1);
      lastTap.current = 0;
      return;
    } else
      tapTimer.current = setTimeout(() => {
        if (Date.now() - lastTap.current >= 280 && hasVideo) setPaused((p) => !p);
      }, 300);
    lastTap.current = now;
  };

  const railBtn =
    "relative min-w-11 min-h-11 flex flex-col items-center gap-1 text-[12px] font-semibold drop-shadow-media";
  const iconCls = variant === "tt" ? "size-8 fill-media-foreground" : "size-7";
  return (
    <section
      ref={ref}
      className="relative h-full w-full snap-start snap-always overflow-hidden text-media-foreground"
    >
      <div
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
        onPointerDown={(e) => {
          touchStart.current = { x: e.clientX, y: e.clientY };
          moved.current = false;
        }}
        onPointerMove={(e) => {
          if (Math.hypot(e.clientX - touchStart.current.x, e.clientY - touchStart.current.y) > 10) {
            moved.current = true;
            clearTimeout(tapTimer.current);
          }
        }}
        onClick={onTap}
        onScroll={(e) =>
          setIdx(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))
        }
      >
        {post.media.map((m, i) => (
          <div key={m.id + i} className="h-full w-full shrink-0 snap-center">
            <MediaView
              m={m}
              active={active && i === idx}
              muted={muted}
              paused={paused}
              smartFit={variant === "tt"}
            />
          </div>
        ))}
      </div>
      {variant !== "tt" && <div className="pointer-events-none absolute inset-0 bg-media-scrim" />}
      {burst > 0 && (
        <Heart
          key={burst}
          className="pointer-events-none absolute start-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 animate-heart-burst fill-like text-like rtl:translate-x-1/2"
        />
      )}
      {paused && (
        <Play className="pointer-events-none absolute start-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 fill-media-foreground/70 text-transparent rtl:translate-x-1/2" />
      )}
      {post.media.length > 1 && (
        <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+56px)] flex justify-center gap-1">
          {post.media.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i === idx ? "w-4 bg-media-foreground" : "w-1 bg-media-foreground/50",
              )}
            />
          ))}
        </div>
      )}

      <div
        className={cn(
          "video-rail absolute bottom-4 end-2 flex flex-col items-center gap-5",
          variant === "tt" && "tt-rail",
        )}
      >
        {variant === "tt" && (
          <div className="relative mb-2">
            <button onClick={() => onProfile(author.id)}>
              <Avatar p={author} size={46} className="border border-media-foreground" />
            </button>
            {!author.isMe && !g.state.following[author.id] && (
              <button
                onClick={() => g.toggle("following", author.id)}
                aria-label={g.t("follow")}
                className="absolute -bottom-2.5 start-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground rtl:translate-x-1/2"
              >
                <Plus className="size-3.5" strokeWidth={3} />
              </button>
            )}
          </div>
        )}
        <button
          className={cn(railBtn, "reaction reaction-like")}
          data-active={liked}
          aria-pressed={liked}
          onClick={() => g.toggle("liked", post.id)}
          aria-label="like"
        >
          <Heart
            className={cn(
              iconCls,
              "transition-transform active:scale-75",
              liked && "fill-like text-like",
            )}
            strokeWidth={variant === "tt" ? 0 : 2}
          />
          {fmtCount(g.likeCount(post), g.lang)}
        </button>
        <button className={railBtn} onClick={() => onComments(post.id)} aria-label="comments">
          {variant === "tt" ? (
            <MessageCircleMore
              className="size-8 fill-media-foreground text-black"
              strokeWidth={1.8}
            />
          ) : (
            <MessageCircle
              className={cn(iconCls, variant === "ig" && "-scale-x-100")}
              strokeWidth={2}
            />
          )}
          {fmtCount(g.commentsFor(post.id).length, g.lang)}
        </button>
        <button
          className={cn(railBtn, "reaction reaction-save")}
          data-active={saved}
          aria-pressed={saved}
          onClick={() => g.toggle("saved", post.id)}
          aria-label="save"
        >
          <Bookmark
            className={cn(
              iconCls,
              saved && (variant === "tt" ? "fill-tt-gold" : "fill-media-foreground"),
            )}
            strokeWidth={variant === "tt" ? 0 : 2}
          />
          {variant === "tt" && fmtCount(post.baseReposts + (saved ? 1 : 0), g.lang)}
        </button>
        <button className={railBtn} onClick={() => toast(g.t("shareSimulated"))} aria-label="share">
          {variant === "tt" ? (
            <Forward className="size-8 fill-media-foreground" strokeWidth={1.5} />
          ) : (
            <Send className="size-7" />
          )}
          {variant === "tt" && fmtCount(post.baseReposts, g.lang)}
        </button>
        {hasVideo && variant !== "tt" && (
          <button className={railBtn} onClick={() => setMuted(!muted)} aria-label="mute">
            {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
          </button>
        )}
        <button
          onClick={() => setMuted(!muted)}
          aria-label="mute"
          title={muted ? "Unmute / تشغيل الصوت" : "Mute / كتم الصوت"}
          className={cn(
            "size-9 overflow-hidden border-[6px] border-media-foreground/20",
            variant === "tt" ? "animate-spin-slow rounded-full" : "rounded-md",
          )}
        >
          <img src={author.avatar} alt="" className="h-full w-full object-cover" />
        </button>
      </div>

      <div
        className={cn(
          "video-caption absolute bottom-4 start-3 end-20 space-y-1.5 text-[14.5px] drop-shadow-media",
          variant === "tt" && "tt-caption",
        )}
      >
        <div className="flex items-center gap-2">
          {variant === "ig" && (
            <button onClick={() => onProfile(author.id)}>
              <Avatar p={author} size={32} />
            </button>
          )}
          <button onClick={() => onProfile(author.id)} className="font-bold">
            {variant === "tt" ? author.name[g.lang] : author.handle}
          </button>
          {author.verified && <Verified />}
          {variant === "ig" && !author.isMe && (
            <button
              onClick={() => g.toggle("following", author.id)}
              className="rounded-lg border border-media-foreground/60 px-2.5 py-0.5 text-[13px] font-semibold"
            >
              {g.state.following[author.id] ? g.t("followingBtn") : g.t("follow")}
            </button>
          )}
          {variant !== "tt" && <DemoChip />}
        </div>
        <p dir="auto" className="line-clamp-2 leading-snug">
          {post.caption[g.lang]}
        </p>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[13px] opacity-90",
            variant === "tt" && "sr-only",
          )}
        >
          <Music2 className="size-3.5" />
          <span className="truncate">
            {author.handle} · {g.t("originalSound")}
          </span>
        </div>
      </div>
    </section>
  );
}
