import { createLocalId } from "./local-id";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate, type TKey } from "./i18n";
import { readLocalMedia, saveLocalMedia } from "./local-media";
import { sampleRepository } from "./sample-repository";
import type { Comment, GalleryRepository, Lang, Mode, Post, Profile } from "./types";

export const STORAGE_KEY = "social-gallery-v1";
export const ME = "me";

type Flags = Record<string, boolean>;
export type FlagKind =
  "liked" | "saved" | "reposted" | "following" | "likedComments" | "seenStories" | "hidden";

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
  notes: Post[];
  draft: string;
  hidden: Flags;
};

const defaults = (repo: GalleryRepository): GalleryState => ({
  mode: "ig",
  lang: "en",
  dark: false,
  liked: {},
  saved: {},
  reposted: {},
  following: { coast: true },
  likedComments: {},
  seenStories: {},
  comments: repo.getSeedComments(),
  notes: [],
  draft: "",
  hidden: {},
});

function load(repo: GalleryRepository): GalleryState {
  const base = defaults(repo);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const value = JSON.parse(raw);
      if (!value || typeof value !== "object") return base;
      const merged = { ...base, ...value };
      for (const key of [
        "liked",
        "saved",
        "reposted",
        "following",
        "likedComments",
        "seenStories",
        "hidden",
      ] as const) {
        if (!merged[key] || typeof merged[key] !== "object" || Array.isArray(merged[key]))
          merged[key] = base[key];
      }
      if (!Array.isArray(merged.comments)) merged.comments = base.comments;
      if (!Array.isArray(merged.notes)) merged.notes = [];
      if (typeof merged.draft !== "string") merged.draft = "";
      if (!["ig", "tt", "x"].includes(merged.mode)) merged.mode = base.mode;
      if (!["en", "ar"].includes(merged.lang)) merged.lang = base.lang;
      return merged;
    }
  } catch {
    /* corrupted storage → defaults */
  }
  return base;
}

function useGalleryApi(repo: GalleryRepository) {
  const [data] = useState(() => ({ profiles: repo.getProfiles(), posts: repo.getPosts() }));
  const [state, setState] = useState<GalleryState>(() => load(repo));

  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    let alive = true;
    let urls: string[] = [];
    readLocalMedia()
      .then((posts) => {
        urls = posts.flatMap((p) => p.media.map((m) => m.src));
        if (alive)
          setLocalPosts((current) =>
            Array.from(new Map([...posts, ...current].map((p) => [p.id, p])).values()),
          );
        else urls.forEach(URL.revokeObjectURL);
      })
      .catch(() => setStorageError(true));
    return () => {
      alive = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  const importMedia = useCallback(async (files: File[]) => {
    const posts = await saveLocalMedia(files);
    setLocalPosts((s) => [...posts, ...s]);
  }, []);
  const saveNote = useCallback((text: string, id?: string, quoteId?: string) => {
    if (!text.trim()) return;
    setState((s) => {
      if (id)
        return {
          ...s,
          notes: s.notes.map((p) =>
            p.id === id ? { ...p, caption: { en: text.trim(), ar: text.trim() } } : p,
          ),
        };
      const note: Post = {
        id: createLocalId(),
        authorId: ME,
        media: [],
        caption: { en: text.trim(), ar: text.trim() },
        createdAt: Date.now(),
        baseLikes: 0,
        baseReposts: 0,
        views: 0,
        quoteId,
      };
      return { ...s, draft: "", notes: [note, ...s.notes] };
    });
  }, []);
  const deleteNote = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        notes: s.notes.filter((p) => p.id !== id),
        comments: s.comments.filter((c) => c.postId !== id),
      })),
    [],
  );
  useEffect(() => {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
  }, [state.lang]);

  const set = useCallback(
    <K extends keyof GalleryState>(k: K, v: GalleryState[K]) => setState((s) => ({ ...s, [k]: v })),
    [],
  );
  const toggle = useCallback(
    (kind: FlagKind, id: string, value?: boolean) =>
      setState((s) => ({ ...s, [kind]: { ...s[kind], [id]: value ?? !s[kind][id] } })),
    [],
  );

  const addComment = useCallback((postId: string, text: string, parentId: string | null = null) => {
    if (!text.trim()) return;
    const c: Comment = {
      id: createLocalId(),
      postId,
      authorId: ME,
      text: text.trim(),
      createdAt: Date.now(),
      parentId,
      baseLikes: 0,
    };
    setState((s) => ({ ...s, comments: [...s.comments, c] }));
  }, []);
  const editComment = useCallback(
    (id: string, text: string) =>
      setState((s) => ({
        ...s,
        comments: s.comments.map((c) =>
          c.id === id ? { ...c, text: text.trim(), edited: true } : c,
        ),
      })),
    [],
  );
  const deleteComment = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        comments: s.comments.filter((c) => c.id !== id && c.parentId !== id),
      })),
    [],
  );
  const reset = useCallback(
    () => setState((s) => ({ ...defaults(repo), mode: s.mode, lang: s.lang, dark: s.dark })),
    [repo],
  );

  return useMemo(() => {
    const profileMap = new Map(data.profiles.map((p) => [p.id, p]));
    return {
      state,
      set,
      toggle,
      addComment,
      editComment,
      deleteComment,
      reset,
      saveNote,
      deleteNote,
      importMedia,
      storageError,
      profiles: data.profiles,
      posts: [...localPosts, ...data.posts].filter((p) => !state.hidden[p.id]),
      photoPosts: [...localPosts, ...data.posts].filter(
        (p) => !state.hidden[p.id] && p.media.length && p.media.every((m) => m.kind === "image"),
      ),
      videoPosts: [...localPosts, ...data.posts].filter(
        (p) => !state.hidden[p.id] && p.media.length && p.media.every((m) => m.kind === "video"),
      ),
      notes: state.notes,
      repoId: repo.id,
      lang: state.lang,
      t: (k: TKey, vars?: Record<string, string | number>) => translate(state.lang, k, vars),
      profile: (id: string) => profileMap.get(id) as Profile,
      postsBy: (id: string) =>
        [...localPosts, ...data.posts].filter((p) => p.authorId === id && !state.hidden[p.id]),
      likeCount: (p: Post) => p.baseLikes + (state.liked[p.id] ? 1 : 0),
      repostCount: (p: Post) => p.baseReposts + (state.reposted[p.id] ? 1 : 0),
      followerCount: (p: Profile) => p.baseFollowers + (state.following[p.id] ? 1 : 0),
      commentsFor: (postId: string) => state.comments.filter((c) => c.postId === postId),
      commentLikes: (c: Comment) => c.baseLikes + (state.likedComments[c.id] ? 1 : 0),
    };
  }, [
    state,
    data,
    localPosts,
    storageError,
    repo.id,
    set,
    toggle,
    addComment,
    editComment,
    deleteComment,
    reset,
    saveNote,
    deleteNote,
    importMedia,
  ]);
}

export type GalleryApi = ReturnType<typeof useGalleryApi>;
const Ctx = createContext<GalleryApi | null>(null);

/** Client-only provider: mount after hydration (reads localStorage). Swap `repository` for a MediaStore-backed one later. */
export function GalleryProvider({
  children,
  repository = sampleRepository,
}: {
  children: ReactNode;
  repository?: GalleryRepository;
}) {
  const api = useGalleryApi(repository);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGallery() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGallery must be used inside GalleryProvider");
  return v;
}
