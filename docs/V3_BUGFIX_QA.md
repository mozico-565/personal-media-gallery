# Social Gallery V3 bugfix QA

Status: **in progress / visual acceptance blocked**. No merge or deployment. The supplied comparison screenshots are cropped captures at different scales and do not include equivalent full device viewports. The supplied 11.52-second phone recording was inspected: it demonstrates attempts to dismiss the existing Instagram comments panel, but does not show a successful reference dismissal whose easing can be measured. Consequently the side-by-side images are useful focused comparisons, not proof of same-viewport or motion fidelity.

## BUG-001 — Instagram

- Arial bold was used for the wordmark and stories were 88 CSS pixels. `src/gallery/instagram.tsx` and `src/styles.css` now use a bundled URW Gothic font and 78px rings, with smaller labels and adjusted section height. Existing pictures and interactions are unchanged. The new typeface is an approximation, not the Instagram wordmark.
- [Focused comparison](bugfix-instagram-focused.jpg): reference crop, supplied before crop, and browser after screenshot. These have different crops and light/dark themes and are resized independently. Do not use them for precise same-scale claims. A same-viewport dark-theme comparison and other phone widths remain outstanding.

## BUG-002 — Comment sheets

- The old handle reacted only after touch end, without tracking or cancellation. `src/gallery/shared.tsx` adds a pointer-captured handle with finger tracking, a distance/velocity threshold, cancellation and snap-back. Enabled for both comments in `instagram.tsx` and `tiktok.tsx`; the close button and backdrop remain.
- Cloud Chrome: a short mouse drag on TikTok returned to position; a long drag closed it. A long mouse drag closed Instagram comments. Automated pointer tests cover movement, short drag, cancellation and long drag. Actual phone touch, multitouch and reference-motion comparison are not yet verified. The gesture starts only at the handle, so comment list scrolling is not intercepted.

## BUG-003 — TikTok

- `src/styles.css` adjusts rail icon sizing and Arabic navigation label spacing. Actions and existing reaction animations remain in place. [Focused comparison](bugfix-tiktok-focused.jpg) uses differently cropped source screenshots and a test video; it is not an equal-viewport acceptance comparison. The after capture precedes the final navigation-spacing adjustment. Icon shape, complete RTL layout and multiple viewport sizes still require visual review against the original.

## BUG-004 — Video

- Reproduced the reported error on the sample “Night Walks” video: its URL is a remote `commondatastorage.googleapis.com` MP4. This restricted cloud browser could not load the source. No proof was obtained that the original user's file or codec was unsupported. Media error 4 conflates unsupported sources and failed loads.
- `src/gallery/shared.tsx` now offers retry and an honest message that either source loading or format support may be the cause; source changes reset failure. `src/gallery/store.tsx` revokes imported Blob URLs when the provider unmounts, without revoking them when changing tabs.
- Cloud Chrome successfully played a locally generated H.264/yuv420p MP4 (readyState 4, video width 240, advancing playback), including after reload and switching platforms. An intentionally malformed MP4 showed the recovery message. This does not test a valid unsupported codec or physical Android. External demo videos remain dependent on network access; no sample media was replaced.

## Verification

- Typecheck and build passed. Lint reported no errors and seven existing Fast Refresh warnings. All 33 tests passed after the final CSS and effect changes.
- Screenshot reference frames differ in crop and theme. TikTok after image used a generated local test video and was captured in the cloud browser at 430 × 904 CSS pixels. Instagram after image is from the same browser viewport, light mode. Source screenshot crop dimensions: Instagram 583 × 401 reference, 523 × 340 before; TikTok 1080 × 1330 reference, 1080 × 1356 before.
- Missing: a successful reference dismissal animation, equivalent matching screenshot viewport and theme, valid unsupported-codec sample, real touch-device testing, CI results, and phone-accessible independent preview.
