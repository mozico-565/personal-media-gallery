import { useState } from "react";
import { Bot, Camera, Check, Layers, Lock, Music2, RotateCcw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { plannedRepositories } from "./sample-repository";
import { useGallery } from "./store";
import { MediaImport } from "./media-import";
import { BottomSheet } from "./shared";
import type { Mode } from "./types";
import { XLogo } from "./x";

/** Discreet edge handle available in every mode. */
export function PlatformSwitcher() {
  const g = useGallery();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const modes: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "ig", label: g.t("igName"), icon: <Camera className="size-5" /> },
    { id: "x", label: g.t("xName"), icon: <XLogo className="size-4" /> },
    { id: "tt", label: g.t("ttName"), icon: <Music2 className="size-5" /> },
  ];
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={g.t("switchView")}
        className="absolute end-0 top-[38%] z-30 flex h-12 w-5 items-center justify-center rounded-s-xl bg-switcher text-switcher-foreground opacity-60 backdrop-blur-md transition-all hover:w-7 hover:opacity-100 active:w-7"
      >
        <Layers className="size-3.5" />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={g.t("switchView")}>
        <div className="space-y-2 p-4">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                g.set("mode", m.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors",
                g.state.mode === m.id ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  `brand-${m.id}`,
                )}
              >
                {m.icon}
              </span>
              <span className="flex-1 font-semibold">{m.label}</span>
              {g.state.mode === m.id && <Check className="size-5 text-primary" />}
            </button>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Seg
              value={g.state.lang}
              onChange={(v) => g.set("lang", v)}
              options={[
                ["en", "English"],
                ["ar", "العربية"],
              ]}
            />
            <button
              onClick={() => {
                setOpen(false);
                setSettings(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"
            >
              <Settings2 className="size-4" />
              {g.t("settings")}
            </button>
          </div>
        </div>
      </BottomSheet>
      <BottomSheet
        open={settings}
        onClose={() => setSettings(false)}
        title={g.t("settings")}
        className="h-[85%]"
      >
        <SettingsBody />
      </BottomSheet>
    </>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string, boolean?][];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-1 rounded-xl bg-secondary p-1">
      {options.map(([v, l, off]) => (
        <button
          key={v}
          disabled={disabled || off}
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-semibold transition-colors disabled:opacity-40",
            value === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {off && <Lock className="size-3" />}
          {l}
        </button>
      ))}
    </div>
  );
}

const personalities = [
  {
    id: "curator",
    en: ["The Curator", "Thoughtful notes on composition and light"],
    ar: ["المنسّق", "ملاحظات مدروسة عن التكوين والضوء"],
  },
  {
    id: "friend",
    en: ["Warm Friend", "Short, encouraging reactions"],
    ar: ["الصديق الدافئ", "ردود قصيرة ومشجعة"],
  },
  {
    id: "critic",
    en: ["Honest Critic", "Constructive, direct feedback"],
    ar: ["الناقد الصريح", "ملاحظات مباشرة وبنّاءة"],
  },
  {
    id: "storyteller",
    en: ["Storyteller", "Imagines the story behind each photo"],
    ar: ["الراوي", "يتخيّل القصة خلف كل صورة"],
  },
];

function SettingsBody() {
  const g = useGallery();
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 no-scrollbar">
      <Section title={g.t("language")}>
        <Seg
          value={g.state.lang}
          onChange={(v) => g.set("lang", v)}
          options={[
            ["en", "English"],
            ["ar", "العربية"],
          ]}
        />
      </Section>
      <Section title={g.t("darkMode")}>
        <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm">
            {g.t("darkMode")}
            <span className="block text-xs text-muted-foreground">{g.t("darkNote")}</span>
          </span>
          <Switch checked={g.state.dark} onCheckedChange={(v) => g.set("dark", v)} />
        </label>
      </Section>
      <Section title={g.t("mediaSource")}>
        <div className="divide-y divide-border rounded-xl border border-border text-sm">
          <div className="flex items-center gap-2 px-4 py-3">
            <Check className="size-4 text-primary" />
            {g.t("sampleMedia")}
          </div>
          {plannedRepositories.map((r) => (
            <div key={r.id} className="flex items-center gap-2 px-4 py-3 text-muted-foreground">
              <Lock className="size-4" />
              <span className="flex-1">{r.label[g.lang]}</span>
              <Planned />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{g.t("demoVideoNote")}</p>
        <div className="flex gap-2">
          <MediaImport kind="image" className="flex-1 rounded-xl border p-3 text-sm">
            {g.lang === "ar" ? "إضافة صور" : "Add photos"}
          </MediaImport>
          <MediaImport kind="video" className="flex-1 rounded-xl border p-3 text-sm">
            {g.lang === "ar" ? "إضافة فيديوهات" : "Add videos"}
          </MediaImport>
        </div>
        <p className="text-xs text-muted-foreground">
          {g.lang === "ar"
            ? "الوسائط تُحفظ داخل متصفح هذا الجهاز؛ مسح بيانات الموقع يزيل النسخ المستوردة. لا تُرفع ملفاتك. الأرقام والشخصيات محاكاة محلية وليست نشاطًا حقيقيًا."
            : "Media stays in this browser; clearing site data removes imported copies. Files are never uploaded. Counts and personalities are local simulations, not real activity."}
        </p>
      </Section>
      <Section title={g.t("aiTitle")}>
        <div className="rounded-xl border border-dashed border-border p-4">
          <div className="flex items-center gap-2">
            <Bot className="size-5" />
            <span className="flex-1 font-semibold">{g.t("aiTitle")}</span>
            <Planned />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{g.t("aiDesc")}</p>
          <div className="mt-3 space-y-2">
            <span className="text-xs font-semibold">{g.t("replyMode")}</span>
            <Seg
              value="manual"
              onChange={() => {}}
              options={[
                ["manual", g.t("manual")],
                ["ai", g.t("ai"), true],
              ]}
            />
          </div>
          <div className="mt-3 divide-y divide-border">
            {personalities.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 opacity-60">
                <span className="flex-1 text-sm">
                  <b>{p[g.lang][0]}</b>
                  <span className="block text-xs text-muted-foreground">{p[g.lang][1]}</span>
                </span>
                <Switch disabled checked={false} aria-label={`${p.en[0]} (${g.t("notActive")})`} />
              </div>
            ))}
          </div>
        </div>
      </Section>
      <button
        onClick={() => {
          g.reset();
          toast(g.t("resetDone"));
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm font-semibold text-destructive"
      >
        <RotateCcw className="size-4" />
        {g.t("reset")}
      </button>
      <p className="pb-2 text-center text-xs text-muted-foreground">
        {g.t("appName")} · {g.t("demoData")}
      </p>
    </div>
  );
}

function Planned() {
  const { t } = useGallery();
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {t("notActive")}
    </span>
  );
}
