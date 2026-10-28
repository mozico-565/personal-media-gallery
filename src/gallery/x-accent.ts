import type { CSSProperties } from "react";

export const DEFAULT_X_ACCENT = "#ff7a00";
export const validAccent = (value: unknown): value is string =>
  typeof value === "string" && /^#[\da-f]{6}$/i.test(value);

/** Choose the higher-contrast text color for any user-selected sRGB accent. */
export function accentForeground(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000000" : "#ffffff";
}

export function xAccentStyle(value: string): CSSProperties {
  const accent = validAccent(value) ? value : DEFAULT_X_ACCENT;
  return {
    "--x-accent": accent,
    "--x-accent-foreground": accentForeground(accent),
  } as CSSProperties;
}
