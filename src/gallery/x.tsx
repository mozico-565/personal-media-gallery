import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ImagePlus,
  X as Close,
  MoreHorizontal,
  BarChart2,
  Bookmark,
  Heart,
  Home,
  MessageCircle,
  Pencil,
  Repeat2,
  Search,
  Share,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtCount, timeAgo } from "./i18n";
import { ME, useGallery } from "./store";
import { Avatar, BottomSheet, FollowButton, Verified } from "./shared";
import { NoteAttachment } from "./note-attachment";
import { deleteNoteMedia, saveNoteMedia, storageMessage, validateNoteMedia } from "./note-media";
import type { NoteAttachment as Attachment, Comment, Post } from "./types";

export function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-label="X" className={cn("fill-current", className)}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Tab = "home" | "search" | "bookmarks" | "profile";

export function XMode() {
  const g = useGallery();
  const [composing, setComposing] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [feed, setFeed] = useState<"for" | "following">("for");
  const [thread, setThread] = useState<string | null>(null);
  const [profileId, setProfileId] = useState(ME);
  const openProfile = (id: string) => {
    setProfileId(id);
    setThread(null);
    setTab("profile");
  };
  const go = (t: Tab) => {
    setThread(null);
    if (t === "profile") setProfileId(ME);
    setTab(t);
  };
  const posts =
    feed === "for"
      ? g.notes
      : g.notes.filter((p) => g.state.following[p.authorId] || p.authorId === ME);

  return (
    <div className="x-type flex h-full flex-col bg-background text-foreground">
      <main
        key={tab + profileId + (thread ?? "")}
        className="relative min-h-0 flex-1 overflow-y-auto no-scrollbar animate-in fade-in duration-200"
      >
        {thread ? (
          <Thread postId={thread} onBack={() => setThread(null)} onProfile={openProfile} />
        ) : (
          <>
            {tab === "home" && (
              <>
                <header className="sticky top-0 z-10 border-b border-border bg-background/85 pt-safe backdrop-blur-md">
                  <div className="relative flex h-[53px] items-center justify-center px-4">
                    <button className="absolute start-4" onClick={() => go("profile")}>
                      <Avatar p={g.profile(ME)} size={32} />
                    </button>
                    <XLogo className="size-[26px]" />
                  </div>
                  <div className="flex">
                    {(["for", "following"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFeed(f)}
                        className={cn(
                          "flex flex-1 justify-center text-[15px]",
                          feed === f ? "font-bold" : "font-medium text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "relative py-3.5",
                            feed === f &&
                              "after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-full after:bg-primary",
                          )}
                        >
                          {f === "for" ? g.t("forYou") : g.t("followingTab")}
                        </span>
                      </button>
                    ))}
                  </div>
                </header>
                {posts.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground">
                    {g.lang === "ar"
                      ? "اكتب ملاحظتك الأولى من زر القلم"
                      : "Write your first note with the compose button"}
                  </p>
                )}
                {posts.map((p) => (
                  <Tweet
                    key={p.id}
                    post={p}
                    onOpen={() => setThread(p.id)}
                    onProfile={openProfile}
                  />
                ))}
              </>
            )}
            {tab === "search" && <XSearch onOpen={setThread} onProfile={openProfile} />}
            {tab === "bookmarks" && (
              <>
                <XHeader title={g.t("bookmarks")} />
                {g.notes
                  .filter((p) => g.state.saved[p.id])
                  .map((p) => (
                    <Tweet
                      key={p.id}
                      post={p}
                      onOpen={() => setThread(p.id)}
                      onProfile={openProfile}
                    />
                  ))}
                {!g.notes.some((p) => g.state.saved[p.id]) && (
                  <p className="p-8 text-center text-muted-foreground">{g.t("noBookmarks")}</p>
                )}
              </>
            )}
            {tab === "profile" && (
              <XProfile
                id={profileId}
                onBack={() => go("home")}
                onOpen={setThread}
                onProfile={openProfile}
              />
            )}
          </>
        )}
        {!thread && tab === "home" && (
          <button
            onClick={() => setComposing(true)}
            aria-label="compose"
            className="sticky bottom-4 float-end me-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab active:scale-95"
          >
            <Pencil className="size-6" />
          </button>
        )}
      </main>
      <NoteComposer open={composing} onClose={() => setComposing(false)} />
      <nav className="shrink-0 border-t border-border bg-background pb-safe">
        <div className="flex h-[53px] items-center justify-around">
          {(
            [
              ["home", Home],
              ["search", Search],
              ["bookmarks", Bookmark],
              ["profile", User],
            ] as const
          ).map(([k, I]) => (
            <button
              key={k}
              onClick={() => go(k)}
              aria-label={k}
              className="flex flex-1 justify-center py-3 active:scale-90"
            >
              <I
                className={cn(
                  "size-[26px]",
                  tab === k && !thread && (k === "search" ? "stroke-[3]" : "fill-current"),
                )}
              />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function XHeader({ title, sub, onBack }: { title: string; sub?: string; onBack?: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-6 bg-background/85 px-4 pt-safe backdrop-blur-md">
      <div className="flex h-[53px] items-center gap-6">
        {onBack && (
          <button onClick={onBack} aria-label="back">
            <ArrowLeft className="size-5 rtl:rotate-180" />
          </button>
        )}
        <div>
          <div className="text-[19px] font-bold leading-tight">{title}</div>
          {sub && <div className="text-[13px] text-muted-foreground">{sub}</div>}
        </div>
      </div>
    </header>
  );
}

function Actions({ post, onReply, big }: { post: Post; onReply: () => void; big?: boolean }) {
  const g = useGallery();
  const liked = !!g.state.liked[post.id],
    rp = !!g.state.reposted[post.id],
    sv = !!g.state.saved[post.id];
  const sz = big ? "size-[22px]" : "size-[18.75px]";
  const btn = "group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors";
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        big ? "border-y border-border px-2 py-3" : "mt-3 max-w-[425px]",
      )}
    >
      <button
        aria-label={g.t("reply")}
        onClick={(e) => {
          e.stopPropagation();
          onReply();
        }}
        className={cn(btn, "hover:text-primary")}
      >
        <MessageCircle className={sz} />
        {!big && fmtCount(g.commentsFor(post.id).length, g.lang)}
      </button>
      <button
        aria-label={g.t("reposts")}
        aria-pressed={rp}
        onClick={(e) => {
          e.stopPropagation();
          g.toggle("reposted", post.id);
        }}
        className={cn(btn, rp && "text-repost")}
      >
        <Repeat2 className={cn(sz, "active:scale-75")} />
        {!big && fmtCount(g.repostCount(post), g.lang)}
      </button>
      <button
        aria-label={g.t("likes")}
        aria-pressed={liked}
        onClick={(e) => {
          e.stopPropagation();
          g.toggle("liked", post.id);
        }}
        data-active={liked}
        className={cn(btn, "reaction reaction-like", liked && "text-x-like")}
      >
        <Heart className={cn(sz, liked && "fill-current")} />
        {!big && fmtCount(g.likeCount(post), g.lang)}
      </button>
      {!big && (
        <span className={btn}>
          <BarChart2 className={sz} />
          {fmtCount(post.views, g.lang)}
        </span>
      )}
      <span className="flex items-center gap-3">
        <button
          aria-label={g.t("save")}
          aria-pressed={sv}
          onClick={(e) => {
            e.stopPropagation();
            g.toggle("saved", post.id);
          }}
          data-active={sv}
          className={cn(btn, "reaction reaction-save", sv && "text-primary")}
        >
          <Bookmark className={cn(sz, sv && "fill-current")} />
        </button>
        <button
          aria-label={g.lang === "ar" ? "مشاركة" : "Share"}
          onClick={(e) => {
            e.stopPropagation();
            toast(g.t("shareSimulated"));
          }}
          className={btn}
        >
          <Share className={sz} />
        </button>
      </span>
    </div>
  );
}

function Tweet({
  post,
  onOpen,
  onProfile,
}: {
  post: Post;
  onOpen: () => void;
  onProfile: (id: string) => void;
}) {
  const g = useGallery();
  const a = g.profile(post.authorId);
  return (
    <article
      onClick={onOpen}
      className="note-card relative cursor-pointer border-b border-border px-4 py-3 transition-colors active:bg-muted/40"
    >
      {g.state.reposted[post.id] && (
        <div className="mb-1 flex items-center gap-2 ps-8 text-[13px] font-bold text-muted-foreground">
          <Repeat2 className="size-4" />
          {g.lang === "ar" ? "أعدت النشر" : "You reposted"}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProfile(a.id);
          }}
          className="shrink-0"
        >
          <Avatar p={a} size={40} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px] leading-5">
            <span className="truncate font-bold">{a.name[g.lang]}</span>
            {a.verified && <Verified />}
            <span dir="ltr" className="truncate text-muted-foreground">
              @{a.handle} · {timeAgo(post.createdAt, g.lang)}
            </span>
          </div>
          <p dir="auto" className="whitespace-pre-wrap break-words text-[15px] leading-5">
            {post.caption[g.lang]}
          </p>
          {post.attachment && <NoteAttachment attachment={post.attachment} />}
          <NoteTools post={post} />

          <Actions post={post} onReply={onOpen} />
        </div>
      </div>
    </article>
  );
}

function Thread({
  postId,
  onBack,
  onProfile,
}: {
  postId: string;
  onBack: () => void;
  onProfile: (id: string) => void;
}) {
  const g = useGallery();
  const post = g.notes.find((p) => p.id === postId)!;
  const a = g.profile(post?.authorId ?? ME);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  if (!post)
    return (
      <>
        <XHeader title={g.t("postTitle")} onBack={onBack} />
        <p className="p-8 text-muted-foreground">
          {g.lang === "ar" ? "حُذفت الملاحظة" : "Note deleted"}
        </p>
      </>
    );
  const replies = g.commentsFor(postId);
  const top = replies.filter((c) => !c.parentId);
  const submit = () => {
    if (!text.trim()) return;
    g.addComment(postId, text, replyTo?.id ?? null);
    setText("");
    setReplyTo(null);
  };
  return (
    <div>
      <XHeader title={g.t("postTitle")} onBack={onBack} />
      <div className="px-4 pt-2">
        <div className="flex items-center gap-3">
          <button onClick={() => onProfile(a.id)}>
            <Avatar p={a} size={40} />
          </button>
          <div className="flex-1 leading-tight">
            <div className="font-bold">
              {a.name[g.lang]} {a.verified && <Verified />}
            </div>
            <div className="text-[15px] text-muted-foreground">@{a.handle}</div>
          </div>
          {!a.isMe && <FollowButton id={a.id} variant="x" />}
        </div>
        <p dir="auto" className="mt-3 whitespace-pre-wrap break-words text-[17px] leading-6">
          {post.caption[g.lang]}
        </p>
        {post.attachment && <NoteAttachment attachment={post.attachment} />}
        <NoteTools post={post} />

        <div className="py-4 text-[15px] text-muted-foreground">
          {new Date(post.createdAt).toLocaleString(g.lang, {
            hour: "numeric",
            minute: "2-digit",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          · <b className="text-foreground">{fmtCount(post.views, g.lang)}</b> {g.t("views")}
        </div>
        <div className="flex gap-5 border-t border-border py-3 text-[14px] text-muted-foreground">
          <span>
            <b className="text-foreground">{fmtCount(g.repostCount(post), g.lang)}</b>{" "}
            {g.t("reposts")}
          </span>
          <span>
            <b className="text-foreground">{fmtCount(g.likeCount(post), g.lang)}</b> {g.t("likes")}
          </span>
        </div>
        <Actions post={post} big onReply={() => setReplyTo(null)} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-b border-border px-4 py-3"
      >
        {replyTo && (
          <div className="mb-2 flex justify-between ps-12 text-[13px] text-muted-foreground">
            <span>
              {g.t("replyingTo")}{" "}
              <span className="text-primary">@{g.profile(replyTo.authorId).handle}</span>
            </span>
            <button type="button" onClick={() => setReplyTo(null)}>
              {g.t("cancel")}
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Avatar p={g.profile(ME)} size={40} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={g.t("replyPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted-foreground"
          />
          <button
            disabled={!text.trim()}
            className="rounded-full bg-primary px-4 py-1.5 text-[15px] font-bold text-primary-foreground disabled:opacity-50"
          >
            {g.t("reply")}
          </button>
        </div>
      </form>
      {top.map((c) => (
        <div key={c.id} className="border-b border-border">
          <Reply
            c={c}
            hasChildren={replies.some((r) => r.parentId === c.id)}
            onReply={() => setReplyTo(c)}
            onProfile={onProfile}
          />
          {replies
            .filter((r) => r.parentId === c.id)
            .map((r, i, arr) => (
              <Reply
                key={r.id}
                c={r}
                last={i === arr.length - 1}
                onReply={() => setReplyTo(c)}
                onProfile={onProfile}
              />
            ))}
        </div>
      ))}
      {top.length === 0 && (
        <p className="p-8 text-center text-muted-foreground">{g.t("noComments")}</p>
      )}
    </div>
  );
}

function Reply({
  c,
  hasChildren,
  last,
  onReply,
  onProfile,
}: {
  c: Comment;
  hasChildren?: boolean;
  last?: boolean;
  onReply: () => void;
  onProfile: (id: string) => void;
}) {
  const g = useGallery();
  const a = g.profile(c.authorId);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.text);
  const liked = !!g.state.likedComments[c.id];
  return (
    <div className="flex gap-3 px-4 pt-3">
      <div className="flex flex-col items-center">
        <button onClick={() => onProfile(a.id)}>
          <Avatar p={a} size={40} />
        </button>
        {hasChildren && !last && <div className="mt-1 w-0.5 flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 pb-3">
        <div className="flex items-center gap-1 text-[15px]">
          <span className="font-bold">{a.name[g.lang]}</span>
          <span dir="ltr" className="truncate text-muted-foreground">
            @{a.handle} · {timeAgo(c.createdAt, g.lang)}
            {c.edited && ` · ${g.t("edited")}`}
          </span>
        </div>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) {
                g.editComment(c.id, text);
                setEditing(false);
              }
            }}
            className="mt-1 flex gap-2"
          >
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-[15px] outline-none focus:border-primary"
            />
            <button className="font-bold text-primary">{g.t("save")}</button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setText(c.text);
              }}
              className="text-muted-foreground"
            >
              {g.t("cancel")}
            </button>
          </form>
        ) : (
          <p className="text-[15px] leading-5">{c.text}</p>
        )}
        <div className="mt-2 flex items-center gap-8 text-[13px] text-muted-foreground">
          <button onClick={onReply} className="flex items-center gap-1">
            <MessageCircle className="size-[17px]" />
          </button>
          <button
            onClick={() => g.toggle("likedComments", c.id)}
            className={cn("flex items-center gap-1", liked && "text-x-like")}
          >
            <Heart className={cn("size-[17px]", liked && "fill-current")} />
            {g.commentLikes(c) || ""}
          </button>
          {c.authorId === ME && (
            <>
              <button onClick={() => setEditing(true)} aria-label={g.t("edit")}>
                <Pencil className="size-[16px]" />
              </button>
              <button
                onClick={() => {
                  g.deleteComment(c.id);
                  toast(g.t("commentDeleted"));
                }}
                aria-label={g.t("delete")}
                className="text-destructive"
              >
                <Trash2 className="size-[16px]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function XSearch({
  onOpen,
  onProfile,
}: {
  onOpen: (id: string) => void;
  onProfile: (id: string) => void;
}) {
  const g = useGallery();
  const [q, setQ] = useState("");
  const s = q.toLowerCase();
  const posts = g.notes.filter(
    (p) => !s || p.caption.en.toLowerCase().includes(s) || p.caption.ar.includes(q),
  );
  const people = g.profiles.filter(
    (p) =>
      !p.isMe &&
      (!s || p.handle.includes(s) || p.name.en.toLowerCase().includes(s) || p.name.ar.includes(q)),
  );
  return (
    <div>
      <div className="sticky top-0 z-10 bg-background px-4 pb-2 pt-safe">
        <div className="mt-2 flex h-10 items-center gap-3 rounded-full bg-secondary px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={g.t("searchPlaceholder")}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      {people.map((p) => (
        <div key={p.id} className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => onProfile(p.id)}>
            <Avatar p={p} size={40} />
          </button>
          <button onClick={() => onProfile(p.id)} className="flex-1 text-start leading-tight">
            <div className="font-bold">
              {p.name[g.lang]} {p.verified && <Verified />}
            </div>
            <div className="text-muted-foreground">@{p.handle}</div>
          </button>
          <FollowButton id={p.id} variant="x" />
        </div>
      ))}
      <div className="border-t border-border" />
      {posts.map((p) => (
        <Tweet key={p.id} post={p} onOpen={() => onOpen(p.id)} onProfile={onProfile} />
      ))}
      {posts.length === 0 && people.length === 0 && (
        <p className="p-8 text-center text-muted-foreground">{g.t("noResults")}</p>
      )}
    </div>
  );
}

function XProfile({
  id,
  onBack,
  onOpen,
  onProfile,
}: {
  id: string;
  onBack: () => void;
  onOpen: (id: string) => void;
  onProfile: (id: string) => void;
}) {
  const g = useGallery();
  const p = g.profile(id);
  const [tab, setTab] = useState<"posts" | "likes">("posts");
  const own = g.notes.filter((p) => p.authorId === id);
  const list = tab === "likes" ? g.notes.filter((x) => g.state.liked[x.id]) : own;
  const tabs = [
    ["posts", g.lang === "ar" ? "المنشورات" : "Posts"],
    ...(p.isMe ? [["likes", g.lang === "ar" ? "الإعجابات" : "Likes"]] : []),
  ] as [typeof tab, string][];
  return (
    <div>
      <XHeader title={p.name[g.lang]} sub={`${own.length} ${g.t("posts")}`} onBack={onBack} />
      <div className="h-[120px] bg-gradient-to-br from-primary/30 to-muted" />
      <div className="px-4">
        <div className="flex items-end justify-between">
          <Avatar p={p} size={80} className="-mt-10 border-4 border-background" />
          {p.isMe ? (
            <button
              onClick={() => toast(g.t("uploadDisabled"))}
              className="rounded-full border border-border px-4 py-1.5 text-[15px] font-bold"
            >
              {g.t("edit")}
            </button>
          ) : (
            <FollowButton id={p.id} variant="x" />
          )}
        </div>
        <div className="mt-2 text-[20px] font-extrabold leading-tight">
          {p.name[g.lang]} {p.verified && <Verified />}
        </div>
        <div className="text-[15px] text-muted-foreground">@{p.handle}</div>
        <p className="mt-3 text-[15px]">{p.bio[g.lang]}</p>
        <div className="mt-3 flex gap-5 text-[14px] text-muted-foreground">
          <span>
            <b className="text-foreground">
              {fmtCount(
                p.isMe ? Object.values(g.state.following).filter(Boolean).length : p.followingCount,
                g.lang,
              )}
            </b>{" "}
            {g.t("following")}
          </span>
          <span>
            <b className="text-foreground">{fmtCount(g.followerCount(p), g.lang)}</b>{" "}
            {g.t("followers")}
          </span>
        </div>
      </div>
      <div className="mt-3 flex border-b border-border">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex flex-1 justify-center text-[15px]",
              tab === k ? "font-bold" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "relative py-3.5",
                tab === k &&
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-full after:bg-primary",
              )}
            >
              {l}
            </span>
          </button>
        ))}
      </div>
      {list.map((x) => (
        <Tweet key={x.id} post={x} onOpen={() => onOpen(x.id)} onProfile={onProfile} />
      ))}
      {list.length === 0 && (
        <p className="p-8 text-center text-muted-foreground">{g.t("noResults")}</p>
      )}
    </div>
  );
}

export function NoteComposer({
  open,
  onClose,
  note,
  quoteId,
}: {
  open: boolean;
  onClose: () => void;
  note?: Post;
  quoteId?: string;
}) {
  const g = useGallery();
  const [editText, setEditText] = useState(note?.caption[g.lang] ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const text = note ? editText : g.state.draft;
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // A cancelled selection is never written to IndexedDB.
  const close = () => {
    if (!submitting.current) {
      setFile(null);
      setRemoved(false);
      setError("");
      onClose();
    }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    let added: Attachment | undefined;
    try {
      if (file) added = await saveNoteMedia(file);
      g.saveNote(text, note?.id, quoteId, added ?? (removed ? null : undefined));
      setFile(null);
      setRemoved(false);
      onClose();
    } catch {
      if (added) void deleteNoteMedia(added.id).catch(() => {});
      setError(storageMessage());
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={g.lang === "ar" ? "ملاحظة شخصية" : "Personal note"}
      className="h-[85%]"
    >
      <form onSubmit={submit} className="note-composer flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
          <button type="button" disabled={busy} onClick={close}>
            {g.t("cancel")}
          </button>
          <button
            disabled={!text.trim() || busy}
            className="rounded-full bg-primary px-5 py-1.5 font-bold text-primary-foreground disabled:opacity-40"
          >
            {busy ? (g.lang === "ar" ? "جار الحفظ…" : "Saving…") : g.t("post")}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex gap-3">
            <Avatar p={g.profile(ME)} size={40} />
            <textarea
              aria-label={g.t("whatsHappening")}
              dir="auto"
              maxLength={10000}
              disabled={busy}
              value={text}
              onChange={(e) =>
                note ? setEditText(e.target.value) : g.set("draft", e.target.value)
              }
              placeholder={g.t("whatsHappening")}
              className="min-h-32 w-full resize-y bg-transparent text-xl outline-none"
            />
          </div>
          {(file || (note?.attachment && !removed)) && (
            <div className="relative mt-3">
              <button
                type="button"
                disabled={busy}
                aria-label="Remove attachment / إزالة المرفق"
                onClick={() => {
                  setFile(null);
                  setRemoved(true);
                }}
                className="absolute end-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-black/75 text-white"
              >
                <Close className="size-5" />
              </button>
              {file ? (
                <div className="note-attachment">
                  {file.type.startsWith("image/") ? (
                    <img src={preview} alt={file.name} className="max-h-64 w-full object-contain" />
                  ) : (
                    <video src={preview} controls muted playsInline className="max-h-64 w-full" />
                  )}
                </div>
              ) : (
                note?.attachment && <NoteAttachment attachment={note.attachment} />
              )}
            </div>
          )}
          {quoteId && (
            <p className="mt-3 rounded-xl border p-3 text-sm">
              {g.notes.find((p) => p.id === quoteId)?.caption[g.lang] ??
                (g.lang === "ar" ? "الملاحظة الأصلية حُذفت" : "Original note deleted")}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <div className="shrink-0 border-t border-border px-4 py-2">
          <input
            ref={input}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/ogg"
            aria-label="Note attachment / مرفق الملاحظة"
            disabled={busy}
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              e.target.value = "";
              if (!chosen) return;
              try {
                validateNoteMedia(chosen);
                setFile(chosen);
                setRemoved(false);
                setError("");
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <ImagePlus className="size-5" />
              {g.lang === "ar"
                ? file || note?.attachment
                  ? "استبدال المرفق"
                  : "إرفاق صورة أو فيديو"
                : file || note?.attachment
                  ? "Replace attachment"
                  : "Attach photo or video"}
            </button>
            <span className="text-xs text-muted-foreground">{text.length}/10000</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {g.lang === "ar"
              ? "على جهازك فقط · مرفق واحد حتى 50 ميغابايت · تُحفظ مسودة النص تلقائيًا"
              : "Only on this device · one attachment up to 50 MB · text draft saved automatically"}
          </p>
        </div>
      </form>
    </BottomSheet>
  );
}

function NoteTools({ post }: { post: Post }) {
  const g = useGallery();
  const [edit, setEdit] = useState(false);
  const [quote, setQuote] = useState(false);
  const [tools, setTools] = useState(false);
  const original = post.quoteId ? g.notes.find((p) => p.id === post.quoteId) : null;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {post.quoteId && (
        <blockquote
          dir="auto"
          className="mt-3 whitespace-pre-wrap break-words rounded-2xl border p-3 text-sm text-muted-foreground"
        >
          {original?.caption[g.lang] ??
            (g.lang === "ar" ? "الملاحظة الأصلية حُذفت" : "Original note deleted")}
        </blockquote>
      )}
      <button
        onClick={() => setTools(true)}
        aria-label={g.lang === "ar" ? "خيارات الملاحظة" : "Note options"}
        className="note-options"
      >
        <MoreHorizontal className="size-5" />
      </button>
      <BottomSheet
        open={tools}
        onClose={() => setTools(false)}
        title={g.lang === "ar" ? "خيارات الملاحظة" : "Note options"}
      >
        <div className="flex flex-col gap-2 p-4 text-start text-sm font-semibold">
          <button
            onClick={() => {
              setTools(false);
              setQuote(true);
            }}
          >
            {g.lang === "ar" ? "اقتباس" : "Quote"}
          </button>
          {post.authorId === ME && (
            <>
              <button
                onClick={() => {
                  setTools(false);
                  setEdit(true);
                }}
              >
                {g.t("edit")}
              </button>
              <button
                className="text-destructive"
                onClick={() => {
                  try {
                    g.deleteNote(post.id);
                    setTools(false);
                  } catch {
                    toast(storageMessage());
                  }
                }}
              >
                {g.t("delete")}
              </button>
            </>
          )}
        </div>
      </BottomSheet>
      {edit && <NoteComposer open onClose={() => setEdit(false)} note={post} />}
      {quote && <NoteComposer open onClose={() => setQuote(false)} quoteId={post.id} />}
    </div>
  );
}
