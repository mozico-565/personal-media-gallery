import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type TKey } from "./i18n";
import { sampleRepository } from "./sample-repository";
import type { Comment, GalleryRepository, Lang, Mode, Post, Profile } from "./types";

export const STORAGE_KEY = "social-gallery-v1";
export const ME = "me";

type Flags = Record<string, boolean>;
export type FlagKind = "liked" | "saved" | "reposted" | "following" | "likedComments" | "seenStories";

export type GalleryState = {
  mode: Mode;
  lang: Lang;
  dark: boolean;
  liked: Flags;
  saved: Flags;
  reposted: Flags;
  following: Flags;
  likedComments: Flags;
  seenStories: Flags;
  comments: Comment[];
};

const defaults = (repo: GalleryRepository): GalleryState => ({
  mode: "ig", lang: "en", dark: false, liked: {}, saved: {}, reposted: {},
  following: { coast: true }, likedComments: {}, seenStories: {}, comments: repo.getSeedComments(),
});

function load(repo: GalleryRepository): GalleryState {
  const base = defaults(repo);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...base, ...JSON.parse(raw) };
  } catch { /* corrupted storage → defaults */ }
  return base;
}

function useGalleryApi(repo: GalleryRepository) {
  const [data] = useState(() => ({ profiles: repo.getProfiles(), posts: repo.getPosts() }));
  const [state, setState] = useState<GalleryState>(() => load(repo));

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
  }, [state.lang]);

  const set = useCallback(<K extends keyof GalleryState>(k: K, v: GalleryState[K]) => setState((s) => ({ ...s, [k]: v })), []);
  const toggle = useCallback((kind: FlagKind, id: string, value?: boolean) =>
    setState((s) => ({ ...s, [kind]: { ...s[kind], [id]: value ?? !s[kind][id] } })), []);

  const addComment = useCallback((postId: string, text: string, parentId: string | null = null) => {
    const c: Comment = { id: `u${Date.now().toString(36)}`, postId, authorId: ME, text: text.trim(), createdAt: Date.now(), parentId, baseLikes: 0 };
    setState((s) => ({ ...s, comments: [...s.comments, c] }));
  }, []);
  const editComment = useCallback((id: string, text: string) =>
    setState((s) => ({ ...s, comments: s.comments.map((c) => (c.id === id ? { ...c, text: text.trim(), edited: true } : c)) })), []);
  const deleteComment = useCallback((id: string) =>
    setState((s) => ({ ...s, comments: s.comments.filter((c) => c.id !== id && c.parentId !== id) })), []);
  const reset = useCallback(() => setState((s) => ({ ...defaults(repo), mode: s.mode, lang: s.lang, dark: s.dark })), [repo]);

  return useMemo(() => {
    const profileMap = new Map(data.profiles.map((p) => [p.id, p]));
    return {
      state, set, toggle, addComment, editComment, deleteComment, reset,
      profiles: data.profiles,
      posts: data.posts,
      repoId: repo.id,
      lang: state.lang,
      t: (k: TKey, vars?: Record<string, string | number>) => translate(state.lang, k, vars),
      profile: (id: string) => profileMap.get(id) as Profile,
      postsBy: (id: string) => data.posts.filter((p) => p.authorId === id),
      likeCount: (p: Post) => p.baseLikes + (state.liked[p.id] ? 1 : 0),
      repostCount: (p: Post) => p.baseReposts + (state.reposted[p.id] ? 1 : 0),
      followerCount: (p: Profile) => p.baseFollowers + (state.following[p.id] ? 1 : 0),
      commentsFor: (postId: string) => state.comments.filter((c) => c.postId === postId),
      commentLikes: (c: Comment) => c.baseLikes + (state.likedComments[c.id] ? 1 : 0),
    };
  }, [state, data, repo.id, set, toggle, addComment, editComment, deleteComment, reset]);
}

export type GalleryApi = ReturnType<typeof useGalleryApi>;
const Ctx = createContext<GalleryApi | null>(null);

/** Client-only provider: mount after hydration (reads localStorage). Swap `repository` for a MediaStore-backed one later. */
export function GalleryProvider({ children, repository = sampleRepository }: { children: ReactNode; repository?: GalleryRepository }) {
  const api = useGalleryApi(repository);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGallery() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGallery must be used inside GalleryProvider");
  return v;
}
