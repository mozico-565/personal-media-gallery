import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, ChevronDown, Clapperboard, Grid3x3, Heart, Home, Menu, MessageCircle, MoreHorizontal, PlusSquare, Search, Send, X as Close } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtCount, timeAgo } from "./i18n";
import { ME, useGallery } from "./store";
import { Avatar, BottomSheet, CommentsPanel, DemoChip, FollowButton, LikesList, MediaView, Verified, VerticalFeed } from "./shared";
import type { Post } from "./types";

type Tab = "home" | "search" | "reels" | "profile";

export function InstagramMode() {
  const g = useGallery();
  const [tab, setTab] = useState<Tab>("home");
  const [profileId, setProfileId] = useState(ME);
  const [comments, setComments] = useState<string | null>(null);
  const [likes, setLikes] = useState<string | null>(null);
  const [detail, setDetail] = useState<Post | null>(null);
  const [story, setStory] = useState<number | null>(null);
  const openProfile = (id: string) => { setProfileId(id); setDetail(null); setTab("profile"); };
  const go = (t: Tab) => { if (t === "profile") setProfileId(ME); setDetail(null); setTab(t); };
  const storyAuthors = g.profiles.filter((p) => !p.isMe);
  const handlers = { onComments: setComments, onLikes: setLikes, onProfile: openProfile };

  return (
    <div className="ig-type flex h-full flex-col bg-background text-foreground">
      {tab === "home" && (
        <header className="flex shrink-0 items-center justify-between px-4 pt-safe">
          <div className="flex h-[52px] items-center gap-1">
            <span className="font-ig-logo text-[30px] leading-none">Instagram</span>
            <ChevronDown className="mt-1 size-4" />
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => go("profile")} aria-label="likes"><Heart className="size-6" /></button>
            <button onClick={() => toast(g.t("shareSimulated"))} aria-label="messages"><Send className="size-6" /></button>
          </div>
        </header>
      )}
      {tab === "search" && (
        <header className="shrink-0 px-4 pt-safe"><div className="h-2" /></header>
      )}

      <main key={tab + profileId} className="relative min-h-0 flex-1 overflow-y-auto no-scrollbar animate-in fade-in duration-200">
        {tab === "home" && <>
          <div className="flex gap-3.5 overflow-x-auto px-3 pb-2.5 pt-1 no-scrollbar">
            <StoryBubble label={g.t("yourStory")} onClick={() => toast(g.t("uploadDisabled"))}>
              <span className="relative"><Avatar p={g.profile(ME)} size={74} />
                <span className="absolute bottom-0 end-0 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground text-base font-bold leading-none">+</span>
              </span>
            </StoryBubble>
            {storyAuthors.map((p, i) => (
              <StoryBubble key={p.id} label={p.handle} onClick={() => setStory(i)}>
                <Avatar p={p} size={78} ring seen={!!g.state.seenStories[p.id]} />
              </StoryBubble>
            ))}
          </div>
          <div className="border-t border-border/60" />
          {g.posts.map((p) => <IGPost key={p.id} post={p} {...handlers} />)}
          <p className="py-8 text-center text-xs text-muted-foreground">{g.t("demoData")}</p>
        </>}
        {tab === "search" && <Explore onOpen={setDetail} />}
        {tab === "reels" && (
          <div className="h-full">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-safe text-media-foreground">
              <span className="flex h-[52px] items-center gap-1 text-[22px] font-bold">{g.t("reels")} <ChevronDown className="size-4" /></span>
            </div>
            <VerticalFeed variant="ig" posts={g.posts.filter((p) => p.media.some((m) => m.kind === "video")).concat(g.posts.filter((p) => p.media[0].kind === "image").slice(0, 4))}
              onComments={setComments} onProfile={openProfile} />
          </div>
        )}
        {tab === "profile" && <IGProfile id={profileId} onBack={profileId !== ME ? () => go("home") : undefined} onOpen={setDetail} />}

        {detail && (
          <div className="absolute inset-0 z-20 overflow-y-auto bg-background no-scrollbar animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="sticky top-0 z-10 flex h-[48px] items-center gap-6 bg-background px-3">
              <button onClick={() => setDetail(null)} aria-label={g.t("close")}><ArrowLeft className="size-6 rtl:rotate-180" /></button>
              <span className="text-[16px] font-bold">{g.t("posts")}</span>
            </div>
            <IGPost post={detail} {...handlers} />
          </div>
        )}
      </main>

      {tab !== "home" || true ? (
        <nav className={cn("shrink-0 border-t pb-safe", tab === "reels" ? "border-transparent bg-media text-media-foreground" : "border-border/60 bg-background")}>
          <div className="flex h-[50px] items-center justify-around">
            <NavBtn on={tab === "home"} onClick={() => go("home")} label={g.t("home")}><Home className={cn("size-[26px]", tab === "home" && "fill-current")} /></NavBtn>
            <NavBtn on={tab === "search"} onClick={() => go("search")} label={g.t("search")}><Search className="size-[26px]" strokeWidth={tab === "search" ? 3 : 2} /></NavBtn>
            <NavBtn onClick={() => toast(g.t("uploadDisabled"))} label={g.t("newPost")}><PlusSquare className="size-[26px]" /></NavBtn>
            <NavBtn on={tab === "reels"} onClick={() => go("reels")} label={g.t("reels")}><Clapperboard className="size-[26px]" strokeWidth={tab === "reels" ? 2.6 : 2} /></NavBtn>
            <NavBtn on={tab === "profile"} onClick={() => go("profile")} label={g.t("profile")}>
              <Avatar p={g.profile(ME)} size={26} className={cn(tab === "profile" && profileId === ME && "outline-2 outline-offset-1 outline-foreground outline")} />
            </NavBtn>
          </div>
        </nav>
      ) : null}

      <BottomSheet open={!!comments} onClose={() => setComments(null)} title={g.t("comments")} className="h-[75%]">
        <CommentsPanel postId={comments} />
      </BottomSheet>
      <BottomSheet open={!!likes} onClose={() => setLikes(null)} title={g.t("likedBy")}>
        <LikesList postId={likes} />
      </BottomSheet>
      {story !== null && <StoryViewer start={story} onClose={() => setStory(null)} onProfile={openProfile} />}
    </div>
  );
}

function NavBtn({ children, onClick, label, on }: { children: React.ReactNode; onClick: () => void; label: string; on?: boolean }) {
  return <button aria-label={label} aria-current={on} onClick={onClick} className="flex flex-1 justify-center py-2 transition-transform active:scale-90">{children}</button>;
}

function StoryBubble({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-[80px] shrink-0 flex-col items-center gap-1">
      {children}
      <span className="w-full truncate text-center text-[12px]">{label}</span>
    </button>
  );
}

export function IGPost({ post, onComments, onLikes, onProfile }: { post: Post; onComments: (id: string) => void; onLikes: (id: string) => void; onProfile: (id: string) => void }) {
  const g = useGallery();
  const a = g.profile(post.authorId);
  const [idx, setIdx] = useState(0);
  const [burst, setBurst] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const liked = !!g.state.liked[post.id];
  const saved = !!g.state.saved[post.id];
  const n = g.commentsFor(post.id).length;
  const ratio = post.media[0].kind === "video" ? "aspect-[4/5]" : post.media[0].height > post.media[0].width ? "aspect-[4/5]" : "aspect-square";
  return (
    <article className="pb-3">
      <div className="flex h-[54px] items-center gap-2.5 px-3">
        <button onClick={() => onProfile(a.id)}><Avatar p={a} size={32} ring={!a.isMe} seen={!!g.state.seenStories[a.id]} /></button>
        <div className="flex-1 leading-tight">
          <button onClick={() => onProfile(a.id)} className="text-[13.5px] font-semibold">{a.handle} {a.verified && <Verified />}</button>
          <div className="text-[11.5px] text-muted-foreground">{g.t("demoData")}</div>
        </div>
        {!a.isMe && !g.state.following[a.id] && <button onClick={() => g.toggle("following", a.id)} className="rounded-lg bg-secondary px-3 py-1.5 text-[13px] font-semibold">{g.t("follow")}</button>}
        <MoreHorizontal className="size-5" />
      </div>
      <div className={cn("relative w-full bg-muted", ratio)}>
        <div className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
          onScroll={(e) => setIdx(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))}
          onClick={() => { const now = Date.now(); if (now - lastTap < 300) { g.toggle("liked", post.id, true); setBurst((b) => b + 1); } setLastTap(now); }}>
          {post.media.map((m, i) => <div key={m.id + i} className="h-full w-full shrink-0 snap-center"><MediaView m={m} active={i === idx} /></div>)}
        </div>
        {post.media.length > 1 && <span className="absolute end-3 top-3 rounded-full bg-overlay px-2 py-0.5 text-[12px] font-medium text-media-foreground">{idx + 1}/{post.media.length}</span>}
        <DemoChip className="absolute start-3 top-3" />
        {burst > 0 && <Heart key={burst} className="pointer-events-none absolute start-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 animate-heart-burst fill-media-foreground text-media-foreground rtl:translate-x-1/2" />}
      </div>
      <div className="flex items-center px-3 pt-2.5">
        <div className="flex flex-1 items-center gap-4">
          <button onClick={() => g.toggle("liked", post.id)} aria-label="like" className="active:scale-75 transition-transform">
            <Heart className={cn("size-[26px]", liked && "fill-like text-like animate-pop")} />
          </button>
          <button onClick={() => onComments(post.id)} aria-label="comment"><MessageCircle className="size-[26px] -scale-x-100" /></button>
          <button onClick={() => toast(g.t("shareSimulated"))} aria-label="share"><Send className="size-[24px]" /></button>
        </div>
        {post.media.length > 1 && (
          <div className="flex gap-1">{post.media.map((_, i) => <span key={i} className={cn("size-1.5 rounded-full", i === idx ? "bg-primary" : "bg-muted-foreground/40")} />)}</div>
        )}
        <div className="flex flex-1 justify-end">
          <button onClick={() => g.toggle("saved", post.id)} aria-label="save"><Bookmark className={cn("size-[26px]", saved && "fill-foreground")} /></button>
        </div>
      </div>
      <div className="space-y-1 px-3 pt-2 text-[13.5px] leading-snug">
        <button onClick={() => onLikes(post.id)} className="font-semibold">{fmtCount(g.likeCount(post), g.lang)} {g.t("likes")}</button>
        <p><span className="font-semibold">{a.handle}</span> {post.caption[g.lang]}</p>
        {n > 0 && <button onClick={() => onComments(post.id)} className="text-muted-foreground">{g.t("viewAllComments", { n })}</button>}
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{timeAgo(post.createdAt, g.lang)}</div>
      </div>
    </article>
  );
}

function Explore({ onOpen }: { onOpen: (p: Post) => void }) {
  const g = useGallery();
  const [q, setQ] = useState("");
  const list = g.posts.filter((p) => {
    const a = g.profile(p.authorId);
    const s = q.toLowerCase();
    return !s || p.caption.en.toLowerCase().includes(s) || p.caption.ar.includes(q) || a.handle.includes(s);
  });
  return (
    <div>
      <div className="px-3 pb-2"><div className="flex h-9 items-center gap-2 rounded-lg bg-secondary px-3">
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={g.t("searchPlaceholder")} className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" />
      </div></div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{g.t("noResults")}</p>}
      <Grid posts={list} onOpen={onOpen} tall />
    </div>
  );
}

function Grid({ posts, onOpen, tall }: { posts: Post[]; onOpen: (p: Post) => void; tall?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {posts.map((p, i) => (
        <button key={p.id} onClick={() => onOpen(p)} className={cn("relative bg-muted", tall && i % 5 === 2 ? "row-span-2" : "aspect-[3/4]")}>
          <img src={p.media[0].poster ?? p.media[0].src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          {p.media[0].kind === "video" && <Clapperboard className="absolute end-1.5 top-1.5 size-4 text-media-foreground drop-shadow-media" />}
          {p.media.length > 1 && <Grid3x3 className="absolute end-1.5 top-1.5 size-4 text-media-foreground drop-shadow-media" />}
        </button>
      ))}
    </div>
  );
}

function IGProfile({ id, onBack, onOpen }: { id: string; onBack?: () => void; onOpen: (p: Post) => void }) {
  const g = useGallery();
  const p = g.profile(id);
  const [tab, setTab] = useState<"grid" | "saved">("grid");
  const posts = tab === "grid" ? g.postsBy(id) : g.posts.filter((x) => g.state.saved[x.id]);
  return (
    <div className="pt-safe">
      <div className="flex h-[48px] items-center gap-3 px-3">
        {onBack && <button onClick={onBack}><ArrowLeft className="size-6 rtl:rotate-180" /></button>}
        <span className="flex-1 text-[20px] font-bold">{p.handle} {p.verified && <Verified className="text-[16px]" />}</span>
        <Menu className="size-6" />
      </div>
      <div className="flex items-center gap-6 px-4 pt-2">
        <Avatar p={p} size={86} ring={!p.isMe} />
        <div className="flex flex-1 justify-around text-center text-[13.5px]">
          <Stat n={g.postsBy(id).length} l={g.t("posts")} />
          <Stat n={g.followerCount(p)} l={g.t("followers")} />
          <Stat n={p.isMe ? Object.values(g.state.following).filter(Boolean).length : p.followingCount} l={g.t("following")} />
        </div>
      </div>
      <div className="px-4 pt-3 text-[13.5px] leading-snug">
        <div className="font-semibold">{p.name[g.lang]}</div>
        <p className="text-muted-foreground">{p.bio[g.lang]}</p>
      </div>
      <div className="flex gap-1.5 px-4 py-3">
        {p.isMe
          ? <button onClick={() => toast(g.t("uploadDisabled"))} className="flex-1 rounded-lg bg-secondary py-1.5 text-[13.5px] font-semibold">{g.t("edit")}</button>
          : <FollowButton id={p.id} className="flex-1" />}
        <button onClick={() => toast(g.t("shareSimulated"))} className="flex-1 rounded-lg bg-secondary py-1.5 text-[13.5px] font-semibold">{g.lang === "ar" ? "مشاركة الملف" : "Share profile"}</button>
      </div>
      <div className="flex border-b border-border/60">
        <button onClick={() => setTab("grid")} className={cn("flex flex-1 justify-center border-b py-2.5", tab === "grid" ? "border-foreground" : "border-transparent text-muted-foreground")}><Grid3x3 className="size-6" /></button>
        {p.isMe && <button onClick={() => setTab("saved")} className={cn("flex flex-1 justify-center border-b py-2.5", tab === "saved" ? "border-foreground" : "border-transparent text-muted-foreground")}><Bookmark className="size-6" /></button>}
      </div>
      {posts.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{g.t("noBookmarks")}</p>}
      <Grid posts={posts} onOpen={onOpen} />
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  const { lang } = useGallery();
  return <div><div className="text-[17px] font-semibold">{fmtCount(n, lang)}</div><div className="text-[13px]">{l}</div></div>;
}

function StoryViewer({ start, onClose, onProfile }: { start: number; onClose: () => void; onProfile: (id: string) => void }) {
  const g = useGallery();
  const authors = g.profiles.filter((p) => !p.isMe);
  const [ai, setAi] = useState(start);
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const a = authors[ai];
  const items = g.postsBy(a.id).map((p) => p.media[0]).slice(0, 3);
  useEffect(() => { g.toggle("seenStories", a.id, true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [a.id]);
  const next = () => {
    if (i < items.length - 1) { setI(i + 1); setProgress(0); }
    else if (ai < authors.length - 1) { setAi(ai + 1); setI(0); setProgress(0); }
    else onClose();
  };
  const prev = () => {
    if (i > 0) setI(i - 1); else if (ai > 0) { setAi(ai - 1); setI(0); }
    setProgress(0);
  };
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => p + 2), 100);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { if (progress >= 100) next(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [progress]);
  const m = items[i];
  return (
    <div data-surface="media" className="absolute inset-0 z-50 bg-media text-media-foreground animate-in zoom-in-95 fade-in duration-200">
      <img src={m.poster ?? m.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-media-scrim" />
      <div className="absolute inset-x-0 top-0 space-y-3 px-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex gap-1">
          {items.map((_, k) => (
            <div key={k} className="h-[2px] flex-1 overflow-hidden rounded bg-media-foreground/35">
              <div className="h-full bg-media-foreground" style={{ width: `${k < i ? 100 : k === i ? Math.min(progress, 100) : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-1 text-[13.5px]">
          <button onClick={() => { onClose(); onProfile(a.id); }} className="flex items-center gap-2"><Avatar p={a} size={32} /><span className="font-semibold">{a.handle}</span></button>
          <span className="opacity-70">{timeAgo(g.postsBy(a.id)[i]?.createdAt ?? Date.now(), g.lang)}</span>
          <DemoChip />
          <button onClick={onClose} className="ms-auto" aria-label={g.t("close")}><Close className="size-7" /></button>
        </div>
      </div>
      <button aria-label="previous" onClick={prev} className="absolute bottom-20 start-0 top-24 w-1/3" />
      <button aria-label="next" onClick={next} className="absolute bottom-20 end-0 top-24 w-2/3" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="flex-1 rounded-full border border-media-foreground/60 px-4 py-2.5 text-[14px] opacity-80">{g.t("replyPlaceholder")}…</div>
        <button onClick={() => g.toggle("liked", `story-${a.id}-${i}`)} aria-label="like">
          <Heart className={cn("size-7", g.state.liked[`story-${a.id}-${i}`] && "fill-like text-like animate-pop")} />
        </button>
        <Send className="size-6" />
      </div>
    </div>
  );
}
