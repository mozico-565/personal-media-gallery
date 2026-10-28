/** Fill only when the viewport already matches the video (at most 6% edge crop).
 * Wide and unusually tall media retain the entire frame, with black letterboxing. */
export function videoFit(width: number, height: number, boxWidth: number, boxHeight: number) {
  if (![width, height, boxWidth, boxHeight].every((v) => v > 0)) return "contain";
  const ratio = width / height / (boxWidth / boxHeight);
  return Math.abs(1 - ratio) <= 0.06 ? "cover" : "contain";
}
