export type Lang = "en" | "ar";
export type Mode = "ig" | "x" | "tt";
export type Localized = { en: string; ar: string };

/** A single photo or video. `source` lets a future Android MediaStore repository plug in. */
export type MediaItem = {
  id: string;
  kind: "image" | "video";
  src: string;
  poster?: string;
  width: number;
  height: number;
  source: "sample" | "device";
};

export type Profile = {
  id: string;
  name: Localized;
  handle: string;
  bio: Localized;
  avatar: string;
  verified?: boolean;
  isMe?: boolean;
  baseFollowers: number;
  followingCount: number;
};

export type Post = {
  id: string;
  authorId: string;
  media: MediaItem[];
  caption: Localized;
  createdAt: number;
  baseLikes: number;
  baseReposts: number;
  views: number;
  quoteId?: string | undefined;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
  parentId: string | null;
  edited?: boolean;
  baseLikes: number;
};

/** Any media provider (bundled samples today, Android MediaStore later) implements this. */
export interface GalleryRepository {
  id: string;
  getProfiles(): Profile[];
  getPosts(): Post[];
  getSeedComments(): Comment[];
}
