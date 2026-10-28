import { createLocalId } from "./local-id";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { translate, type TKey } from "./i18n";
import { readLocalMedia, saveLocalMedia } from "./local-media";
import { deleteNoteMedia } from "./note-media";
import { sampleRepository } from "./sample-repository";
import { DEFAULT_X_ACCENT, validAccent } from "./x-accent";
import type {
  Comment,
  GalleryRepository,
  Lang,
  Mode,
  NoteAttachment,
  Post,
  Profile,
} from "./types";

export const STORAGE_KEY = "social-gallery-v1";
export const ME = "me";

type Flags = Record<string, boolean>;
export type FlagKind =
  "liked" | "saved" | "reposted" | "following" | "likedComments" | "seenStories" | "hidden";

export type GalleryState = {
  mode: Mode;
  lang: Lang;
  dark: boolean;
  xAccent: string;
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
  xAccent: DEFAULT_X_ACCENT,
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
      if (!validAccent(merged.xAccent)) merged.xAccent = DEFAULT_X_ACCENT;
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

  const stateRef = useRef(state);
  stateRef.current = state;
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const importedUrls = useRef(new Set<string>());
  const mounted = useRef(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    let alive = true;
    mounted.current = true;
    const ownedImportedUrls = importedUrls.current;
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
      mounted.current = false;
      urls.forEach(URL.revokeObjectURL);
      ownedImportedUrls.forEach(URL.revokeObjectURL);
      ownedImportedUrls.clear();
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
    const urls = posts.flatMap((post) => post.media.map((media) => media.src));
    if (!mounted.current) {
      urls.forEach(URL.revokeObjectURL);
      return;
    }
    urls.forEach((url) => importedUrls.current.add(url));
    setLocalPosts((s) => [...posts, ...s]);
  }, []);
  // Commit metadata before reporting success or deleting the previous blob.
  const saveNote = useCallback(
    (text: string, id?: string, quoteId?: string, attachment?: NoteAttachment | null) => {
      if (!text.trim()) return;
      const s = stateRef.current;
      const old = id ? s.notes.find((p) => p.id === id) : undefined;
      const note: Post = old
        ? { ...old, caption: { en: text.trim(), ar: text.trim() } }
        : {
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
      if (attachment !== undefined) {
        if (attachment === null) delete note.attachment;
        else note.attachment = attachment;
      }
      const next = {
        ...s,
        draft: id ? s.draft : "",
        notes: id ? s.notes.map((p) => (p.id === id ? note : p)) : [note, ...s.notes],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      stateRef.current = next;
      setState(next);
      if (
        old?.attachment &&
        old.attachment.id !== note.attachment?.id &&
        !next.notes.some((p) => p.attachment?.id === old.attachment!.id)
      )
        void deleteNoteMedia(old.attachment.id).catch(() => {});
    },
    [],
  );
  const deleteNote = useCallback((id: string) => {
    const s = stateRef.current;
    const old = s.notes.find((p) => p.id === id);
    const next = {
      ...s,
      notes: s.notes.filter((p) => p.id !== id),
      comments: s.comments.filter((c) => c.postId !== id),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    stateRef.current = next;
    setState(next);
    if (old?.attachment && !next.notes.some((p) => p.attachment?.id === old.attachment!.id))
      void deleteNoteMedia(old.attachment.id).catch(() => {});
  }, []);
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
    () =>
      setState((s) => ({
        ...defaults(repo),
        mode: s.mode,
        lang: s.lang,
        dark: s.dark,
        xAccent: s.xAccent,
      })),
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
