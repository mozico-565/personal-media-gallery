import { MediaImport } from "./media-import";
import { useState } from "react";
import { ArrowLeft, Home, Play, Plus, Search, User, Users, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtCount } from "./i18n";
import { ME, useGallery } from "./store";
import { Avatar, BottomSheet, CommentsPanel, FollowButton, VerticalFeed } from "./shared";

type Tab = "home" | "friends" | "profile";

export function TikTokMode() {
  const g = useGallery();
  const [tab, setTab] = useState<Tab>("home");
  const [feed, setFeed] = useState<"following" | "for">("for");
  const [comments, setComments] = useState<string | null>(null);
  const [profileId, setProfileId] = useState(ME);
  const [start, setStart] = useState<{ ids: string[]; i: number } | null>(null);
  const openProfile = (id: string) => {
    setProfileId(id);
    setStart(null);
    setTab("profile");
  };
  const go = (t: Tab) => {
    setStart(null);
    if (t === "profile") setProfileId(ME);
    setTab(t);
  };
  const followed = g.videoPosts.filter((p) => g.state.following[p.authorId]);
  const homePosts = feed === "for" ? g.videoPosts : followed;
  const showFeed = tab === "home" || tab === "friends" || start;

  return (
    <div className="tt-type flex h-full flex-col bg-background text-foreground">
      <main
        key={tab + feed + profileId + (start?.i ?? "")}
        className="relative min-h-0 flex-1 animate-in fade-in duration-200"
      >
        {showFeed && (
          <>
            <VerticalFeed
              variant="tt"
              posts={
                start
                  ? start.ids.map((id) => g.videoPosts.find((p) => p.id === id)!)
                  : tab === "friends"
                    ? followed
                    : homePosts
              }
              initialIndex={start?.i ?? 0}
              onComments={setComments}
              onProfile={openProfile}
            />
            {start ? (
              <button
                onClick={() => setStart(null)}
                className="absolute start-3 top-[calc(env(safe-area-inset-top)+12px)] z-10 text-media-foreground drop-shadow-media"
                aria-label="back"
              >
                <ArrowLeft className="size-7 rtl:rotate-180" />
              </button>
            ) : tab === "home" ? (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-5 pt-[calc(env(safe-area-inset-top)+10px)] text-[17px] font-semibold text-media-foreground drop-shadow-media">
                {(["following", "for"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFeed(f)}
                    className={cn(
                      "pointer-events-auto relative pb-1.5",
                      feed === f
                        ? "opacity-100 after:absolute after:inset-x-1/4 after:bottom-0 after:h-[3px] after:rounded-full after:bg-media-foreground"
                        : "opacity-60",
                    )}
                  >
                    {f === "for" ? g.t("forYou") : g.t("followingTab")}
                  </button>
                ))}
                <button
                  onClick={() => go("friends")}
                  className="pointer-events-auto absolute end-4"
                  aria-label={g.t("search")}
                >
                  <Search className="size-6" />
                </button>
              </div>
            ) : (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-[calc(env(safe-area-inset-top)+10px)] text-center text-[17px] font-semibold text-media-foreground drop-shadow-media">
                {g.t("friends")}
              </div>
            )}
            {((tab === "home" && feed === "following") || tab === "friends") &&
              !start &&
              followed.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-10 text-center text-muted-foreground">
                  {g.t("emptyFollowing")}
                </div>
              )}
          </>
        )}
        {tab === "profile" && !start && (
          <TTProfile
            id={profileId}
            onBack={profileId !== ME ? () => go("home") : undefined}
            onOpen={(ids, i) => setStart({ ids, i })}
          />
        )}
      </main>
      <nav
        className={cn(
          "shrink-0 pb-safe",
          showFeed ? "bg-media text-media-foreground" : "border-t border-border bg-background",
        )}
        data-surface={showFeed ? "media" : undefined}
      >
        <div className="flex h-[50px] items-center justify-around text-[10px] font-medium">
          <TTNav on={tab === "home"} onClick={() => go("home")} label={g.t("home")}>
            <Home className={cn("size-6", tab === "home" && "fill-current")} />
          </TTNav>
          <TTNav on={tab === "friends"} onClick={() => go("friends")} label={g.t("friends")}>
            <Users className={cn("size-6", tab === "friends" && "fill-current")} />
          </TTNav>
          <MediaImport kind="video" className="relative flex h-8 w-11 items-center justify-center">
            <span className="absolute inset-y-0 start-0 w-9 rounded-lg bg-tt-cyan" />
            <span className="absolute inset-y-0 end-0 w-9 rounded-lg bg-primary" />
            <span
              className={cn(
                "absolute inset-y-0 inset-x-1 flex items-center justify-center rounded-lg",
                showFeed ? "bg-media-foreground text-media" : "bg-foreground text-background",
              )}
            >
              <Plus className="size-5" strokeWidth={3} />
            </span>
          </MediaImport>
          <TTNav onClick={() => toast(g.t("shareSimulated"))} label={g.t("inbox")}>
            <Mail className="size-6" />
          </TTNav>
          <TTNav on={tab === "profile"} onClick={() => go("profile")} label={g.t("profile")}>
            <User className={cn("size-6", tab === "profile" && "fill-current")} />
          </TTNav>
        </div>
      </nav>
      <BottomSheet
        open={!!comments}
        onClose={() => setComments(null)}
        className="h-[70%]"
        title={
          comments
            ? `${fmtCount(g.commentsFor(comments).length, g.lang)} ${g.t("comments").toLowerCase()}`
            : g.t("comments")
        }
      >
        <CommentsPanel postId={comments} />
      </BottomSheet>
    </div>
  );
}

function TTNav({
  children,
  label,
  on,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  on?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 active:scale-90",
        !on && "opacity-70",
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function TTProfile({
  id,
  onBack,
  onOpen,
}: {
  id: string;
  onBack?: (() => void) | undefined;
  onOpen: (ids: string[], i: number) => void;
}) {
  const g = useGallery();
  const p = g.profile(id);
  const [tab, setTab] = useState<"videos" | "saved" | "liked">("videos");
  const posts =
    tab === "videos"
      ? g.videoPosts.filter((p) => p.authorId === id)
      : tab === "saved"
        ? g.videoPosts.filter((x) => g.state.saved[x.id])
        : g.videoPosts.filter((x) => g.state.liked[x.id]);
  const totalLikes = g.videoPosts
    .filter((p) => p.authorId === id)
    .reduce((s, x) => s + g.likeCount(x), 0);
  return (
    <div className="h-full overflow-y-auto pt-safe no-scrollbar">
      <div className="relative flex h-11 items-center justify-center text-[17px] font-semibold">
        {onBack && (
          <button onClick={onBack} className="absolute start-3">
            <ArrowLeft className="size-6 rtl:rotate-180" />
          </button>
        )}
        {p.name[g.lang]}
      </div>
      <div className="flex flex-col items-center px-4 pt-3">
        <Avatar p={p} size={96} />
        <div className="mt-3 text-[17px] font-semibold">@{p.handle}</div>
        <div className="mt-4 flex items-center gap-6 text-center">
          <TTStat
            n={p.isMe ? Object.values(g.state.following).filter(Boolean).length : p.followingCount}
            l={g.t("following")}
          />
          <span className="h-3 w-px bg-border" />
          <TTStat n={g.followerCount(p)} l={g.t("followers")} />
          <span className="h-3 w-px bg-border" />
          <TTStat n={totalLikes} l={g.t("likes")} />
        </div>
        <div className="mt-4 flex gap-2">
          {p.isMe ? (
            <button
              onClick={() => toast(g.t("uploadDisabled"))}
              className="rounded-md bg-secondary px-6 py-2.5 text-[15px] font-semibold"
            >
              {g.t("edit")}
            </button>
          ) : (
            <FollowButton id={p.id} variant="tt" className="px-12 py-2.5 text-[15px]" />
          )}
        </div>
        <p className="mt-3 text-center text-[14px]">{p.bio[g.lang]}</p>
      </div>
      <div className="mt-4 flex border-b border-border">
        {(p.isMe ? (["videos", "saved", "liked"] as const) : (["videos"] as const)).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 border-b-2 py-2.5 text-[14px] font-semibold",
              tab === k ? "border-foreground" : "border-transparent text-muted-foreground",
            )}
          >
            {k === "videos" ? g.t("posts") : k === "saved" ? g.t("saved") : g.t("likes")}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-px">
        {posts.map((x, i) => (
          <button
            key={x.id}
            onClick={() =>
              onOpen(
                posts.map((q) => q.id),
                i,
              )
            }
            className="relative aspect-[3/4] bg-muted"
          >
            {x.media[0]!.poster ? (
              <img
                src={x.media[0]!.poster}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <video
                src={x.media[0]!.src}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="absolute bottom-1 start-1.5 flex items-center gap-0.5 text-[12px] font-semibold text-media-foreground drop-shadow-media">
              <Play className="size-3 fill-current" />
              {fmtCount(x.views, g.lang)}
            </span>
          </button>
        ))}
      </div>
      {posts.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">{g.t("noResults")}</p>
      )}
    </div>
  );
}

function TTStat({ n, l }: { n: number; l: string }) {
  const { lang } = useGallery();
  return (
    <div>
      <div className="text-[17px] font-bold">{fmtCount(n, lang)}</div>
      <div className="text-[13px] text-muted-foreground">{l}</div>
    </div>
  );
}
