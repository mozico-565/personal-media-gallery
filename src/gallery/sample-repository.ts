import d1 from "@/assets/demo-1.jpg";
import d2 from "@/assets/demo-2.jpg";
import d3 from "@/assets/demo-3.jpg";
import d4 from "@/assets/demo-4.jpg";
import type { Comment, GalleryRepository, MediaItem, Post, Profile } from "./types";

const VIDEO_BASE = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
const img = (id: string, src: string, width: number, height: number): MediaItem => ({
  id,
  kind: "image",
  src,
  width,
  height,
  source: "sample",
});
const vid = (id: string, file: string, poster: string): MediaItem => ({
  id,
  kind: "video",
  src: `${VIDEO_BASE}${file}.mp4`,
  poster,
  width: 1280,
  height: 720,
  source: "sample",
});

const M = {
  coast: () => img("coast", d1, 864, 1152),
  cafe: () => img("cafe", d2, 1024, 1024),
  neon: () => img("neon", d3, 864, 1536),
  dunes: () => img("dunes", d4, 1024, 1024),
};

const profiles: Profile[] = [
  {
    id: "me",
    isMe: true,
    name: { en: "My Gallery", ar: "معرضي" },
    handle: "my.gallery",
    avatar: d2,
    bio: { en: "Personal offline gallery · demo data", ar: "معرض شخصي دون اتصال · بيانات تجريبية" },
    baseFollowers: 0,
    followingCount: 3,
  },
  {
    id: "coast",
    verified: true,
    name: { en: "Coastline Roll", ar: "شريط الساحل" },
    handle: "coastline.roll",
    avatar: d1,
    bio: { en: "Demo album · roads by the sea", ar: "ألبوم تجريبي · طرق بجانب البحر" },
    baseFollowers: 1284,
    followingCount: 88,
  },
  {
    id: "night",
    name: { en: "Night Walks", ar: "مشاوير الليل" },
    handle: "nightwalks",
    avatar: d3,
    bio: { en: "Demo album · neon and rain", ar: "ألبوم تجريبي · نيون ومطر" },
    baseFollowers: 532,
    followingCount: 41,
  },
  {
    id: "dunes",
    name: { en: "Dune Diary", ar: "يوميات الكثبان" },
    handle: "dune.diary",
    avatar: d4,
    bio: { en: "Demo album · quiet deserts", ar: "ألبوم تجريبي · صحاري هادئة" },
    baseFollowers: 2210,
    followingCount: 120,
  },
];

const H = 3600_000;
type Seed = [string, string, MediaItem[], string, string, number, number];
const seeds: Seed[] = [
  [
    "p1",
    "coast",
    [M.coast(), M.dunes()],
    "Golden hour on the cliff road 🌅",
    "الساعة الذهبية على طريق المنحدر 🌅",
    1,
    412,
  ],
  ["p2", "me", [M.cafe()], "Slow morning, good notes ☕", "صباح هادئ وملاحظات جميلة ☕", 3, 58],
  [
    "p3",
    "night",
    [vid("v1", "ForBiggerBlazes", d3)],
    "Sample clip · night mood",
    "مقطع تجريبي · أجواء ليلية",
    5,
    903,
  ],
  [
    "p4",
    "dunes",
    [M.dunes()],
    "Footprints are temporary, sunrises are not",
    "الآثار مؤقتة، أما الشروق فلا",
    8,
    1530,
  ],
  [
    "p5",
    "me",
    [M.neon(), M.coast(), M.cafe()],
    "A week in three frames",
    "أسبوع في ثلاث لقطات",
    12,
    77,
  ],
  [
    "p6",
    "coast",
    [vid("v2", "ForBiggerEscapes", d1)],
    "Sample clip · escape plan",
    "مقطع تجريبي · خطة هروب",
    20,
    2204,
  ],
  ["p7", "night", [M.neon()], "Rain makes the city honest", "المطر يجعل المدينة صادقة", 26, 640],
  [
    "p8",
    "me",
    [vid("v3", "ForBiggerJoyrides", d2)],
    "Sample clip · weekend ride",
    "مقطع تجريبي · رحلة نهاية الأسبوع",
    40,
    121,
  ],
  ["p9", "dunes", [M.dunes(), M.coast()], "From sand to sea", "من الرمل إلى البحر", 52, 988],
  ["p10", "me", [M.coast()], "Saved this view for later", "حفظت هذا المنظر لوقت لاحق", 70, 64],
];

type CSeed = [string, string, string, string, number, string | null];
const commentSeeds: CSeed[] = [
  ["c1", "p1", "night", "That light is unreal.", 0.5, null],
  ["c2", "p1", "me", "Adding this to my favourites.", 0.3, "c1"],
  ["c3", "p1", "dunes", "ما أجمل هذا المنظر", 0.8, null],
  ["c4", "p3", "coast", "Love the colours here.", 2, null],
  ["c5", "p4", "night", "Peaceful.", 4, null],
  ["c6", "p4", "coast", "Where is this?", 3, null],
  ["c7", "p4", "dunes", "Demo location, sadly 😄", 2.5, "c6"],
  ["c8", "p5", "coast", "Second frame is my favourite.", 6, null],
  ["c9", "p6", "dunes", "Need this road trip.", 10, null],
  ["c10", "p7", "dunes", "صورة رائعة", 20, null],
  ["c11", "p9", "night", "The transition is perfect.", 30, null],
];

export const sampleRepository: GalleryRepository = {
  id: "sample-bundled",
  getProfiles: () => profiles,
  getPosts: (): Post[] => {
    const now = Date.now();
    return seeds.map(([id, authorId, media, en, ar, hours, likes], i) => ({
      id,
      authorId,
      media,
      caption: { en, ar },
      createdAt: now - hours * H,
      baseLikes: likes,
      baseReposts: Math.round(likes / 9),
      views: likes * 23 + i * 117,
    }));
  },
  getSeedComments: (): Comment[] => {
    const now = Date.now();
    return commentSeeds.map(([id, postId, authorId, text, hours, parentId], i) => ({
      id,
      postId,
      authorId,
      text,
      parentId,
      createdAt: now - hours * H,
      baseLikes: (i * 7) % 23,
    }));
  },
};

/** Media providers planned for later; shown honestly in Settings. */
export const plannedRepositories = [
  {
    id: "android-mediastore",
    label: { en: "Android device gallery (MediaStore)", ar: "معرض جهاز أندرويد (MediaStore)" },
  },
];
