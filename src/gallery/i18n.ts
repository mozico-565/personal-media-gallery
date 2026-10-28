import type { Lang } from "./types";

const en = {
  appName: "Social Gallery V2",
  demo: "DEMO",
  demoData: "Demo data · sample media",
  home: "Home",
  search: "Search",
  reels: "Reels",
  profile: "Profile",
  newPost: "New",
  posts: "posts",
  followers: "followers",
  following: "following",
  follow: "Follow",
  followingBtn: "Following",
  likes: "likes",
  likedBy: "Likes",
  viewAllComments: "View all {n} comments",
  comments: "Comments",
  addComment: "Add a comment…",
  post: "Post",
  reply: "Reply",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  edited: "edited",
  noComments: "No comments yet. Start the conversation.",
  replyingTo: "Replying to",
  yourStory: "Your story",
  forYou: "For you",
  followingTab: "Following",
  bookmarks: "Bookmarks",
  noBookmarks: "Save posts to find them here.",
  postTitle: "Post",
  replyPlaceholder: "Post your reply",
  reposts: "Reposts",
  views: "Views",
  friends: "Friends",
  uploadDisabled: "This action is not available yet.",
  shareSimulated: "Share simulated — nothing left this device.",
  switchView: "Switch view",
  settings: "Settings & AI",
  language: "Language",
  darkMode: "Dark mode",
  darkNote: "Applies to Instagram style. X and TikTok styles are always dark.",
  mediaSource: "Media source",
  sampleMedia: "Bundled sample photos & demo clips (active)",
  planned: "Planned",
  notActive: "planned, not active",
  aiTitle: "AI personalities",
  aiDesc:
    "Simulated commenters with personalities. Nothing here is implemented yet — no AI runs in this prototype.",
  replyMode: "Comment mode",
  manual: "Manual",
  ai: "AI",
  reset: "Reset demo data",
  resetDone: "Demo data reset",
  emptyFollowing: "Follow some demo albums to fill this feed.",
  searchPlaceholder: "Search captions & albums",
  noResults: "No results",
  originalSound: "original sound",
  demoVideoNote: "Sample clips stream from a public demo set",
  commentDeleted: "Comment deleted",
  igName: "Instagram style",
  xName: "X style",
  ttName: "TikTok style",
  close: "Close",
  saved: "Saved",
  media: "Media",
  replies: "Replies",
  whatsHappening: "Write a private note…",
  inbox: "Inbox",
  views2: "views",
  editedLabel: "Edit comment",
};
type Dict = typeof en;
const ar: Dict = {
  appName: "معرض اجتماعي V2",
  demo: "تجريبي",
  demoData: "بيانات تجريبية · وسائط نموذجية",
  home: "الرئيسية",
  search: "بحث",
  reels: "ريلز",
  profile: "الملف",
  newPost: "جديد",
  posts: "منشورات",
  followers: "متابِعون",
  following: "يتابع",
  follow: "متابعة",
  followingBtn: "تتابعه",
  likes: "إعجاب",
  likedBy: "الإعجابات",
  viewAllComments: "عرض كل التعليقات ({n})",
  comments: "التعليقات",
  addComment: "أضف تعليقًا…",
  post: "نشر",
  reply: "رد",
  edit: "تعديل",
  delete: "حذف",
  save: "حفظ",
  cancel: "إلغاء",
  edited: "معدّل",
  noComments: "لا تعليقات بعد. ابدأ المحادثة.",
  replyingTo: "رد على",
  yourStory: "قصتك",
  forYou: "لك",
  followingTab: "المتابَعون",
  bookmarks: "المحفوظات",
  noBookmarks: "احفظ المنشورات لتجدها هنا.",
  postTitle: "منشور",
  replyPlaceholder: "انشر ردك",
  reposts: "إعادة نشر",
  views: "مشاهدات",
  friends: "الأصدقاء",
  uploadDisabled: "هذه العملية غير متاحة بعد.",
  shareSimulated: "مشاركة محاكاة — لم يغادر شيء هذا الجهاز.",
  switchView: "تبديل الواجهة",
  settings: "الإعدادات والذكاء الاصطناعي",
  language: "اللغة",
  darkMode: "الوضع الداكن",
  darkNote: "ينطبق على نمط إنستغرام. نمطا X وتيك توك داكنان دائمًا.",
  mediaSource: "مصدر الوسائط",
  sampleMedia: "صور ومقاطع تجريبية مضمّنة (مفعّل)",
  planned: "مخطط",
  notActive: "مخطط، غير مفعّل",
  aiTitle: "شخصيات الذكاء الاصطناعي",
  aiDesc:
    "معلّقون افتراضيون بشخصيات مختلفة. لم يُنفَّذ شيء هنا بعد — لا يعمل أي ذكاء اصطناعي في هذا النموذج.",
  replyMode: "وضع التعليق",
  manual: "يدوي",
  ai: "ذكاء اصطناعي",
  reset: "إعادة ضبط البيانات التجريبية",
  resetDone: "أُعيد ضبط البيانات",
  emptyFollowing: "تابع بعض الألبومات التجريبية لملء هذه الصفحة.",
  searchPlaceholder: "ابحث في الأوصاف والألبومات",
  noResults: "لا نتائج",
  originalSound: "الصوت الأصلي",
  demoVideoNote: "المقاطع التجريبية تُبث من مجموعة عامة",
  commentDeleted: "حُذف التعليق",
  igName: "نمط إنستغرام",
  xName: "نمط X",
  ttName: "نمط تيك توك",
  close: "إغلاق",
  saved: "المحفوظة",
  media: "الوسائط",
  replies: "الردود",
  whatsHappening: "اكتب ملاحظة خاصة…",
  inbox: "الوارد",
  views2: "مشاهدة",
  editedLabel: "تعديل التعليق",
};

export type TKey = keyof Dict;
export const dictionaries: Record<Lang, Dict> = { en, ar };

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>) {
  let s = dictionaries[lang][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function fmtCount(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "ar" ? "ar" : "en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function timeAgo(ts: number, lang: Lang) {
  const m = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  const [v, u] =
    m < 1
      ? [0, "now"]
      : m < 60
        ? [m, "m"]
        : m < 1440
          ? [Math.floor(m / 60), "h"]
          : [Math.floor(m / 1440), "d"];
  if (lang === "ar")
    return u === "now" ? "الآن" : `${v} ${u === "m" ? "د" : u === "h" ? "س" : "ي"}`;
  return u === "now" ? "now" : `${v}${u}`;
}
