# V3 visual reference QA

## Artifacts and normalization

- Source truth: the three user screenshots listed in `docs/V3_VISUAL_ACCURACY.md`, content-only normalized copies `docs/v3-accuracy/{ig,tt,x}-reference.jpg`.
- Browser implementation: `docs/v3-accuracy/{ig,tt,x}-after.jpg`; previous branch screenshots `{ig,tt,x}-before.jpg`.
- CSS viewport: IG 360×1039, TT/X 359×734. Second checked size 393×873. Reference raw pixels: IG 513×1536, TT/X 718×1536. Status crops: 56/68 raw px; inferred density normalization, not measured physical DPR.
- Browser viewport screenshots capture real iframe content at CSS scale 0.8 (IG 288×831; TT/X 287×587), matched uniformly to the reference. The browser's displayed DPR is not treated as the source device's DPR. Native status and browser chrome are excluded. Content, counts, followed/seen states differ and are explicitly disclosed, especially the failed external TT source in the baseline.
- State: Arabic RTL, dark, home feed. IG first real carousel. X long text + a single composite image. TT local portrait plus a separate landscape check.
- Full-view evidence: `docs/v3-accuracy/ig-comparison.jpg`, `tt-comparison.jpg`, `x-comparison.jpg`.
- Focused evidence: `docs/v3-accuracy/ig-details.jpg`, `tt-details.jpg`, `x-details.jpg`. Each pairs the same source/implementation region (header, actions/rail and bottom navigation).

## Findings and iteration history

1. [P1, corrected] IG header buttons were reversed in RTL, display logo was off-style, and the carousel dots collided with the action row. Rebuilt header positioning, used a system-font wordmark alternative, moved dots, corrected portrait ratio to 3:4 and added the reference action structure. Initial comparison `docs/v3-accuracy/ig-iteration-1.jpg` (working evidence) led to a smaller 27px wordmark and 7px less story spacing. Final reference comparison and region captures are linked above.
2. [P1, corrected] X had two tabs, four navigation items, an incompletely placed composer button, and no long-text disclosure. Added local functional filters, five-item navigation, pinned compose position, measured post layout and safe expand/collapse. Initial `docs/v3-accuracy/x-iteration-1.jpg` found excess above-image density; reduced the collapsed block to eight lines. Full stored text is preserved. Final evidence is `docs/v3-accuracy/x-comparison.jpg`.
3. [P1, corrected] TT lacked LIVE geometry, full Arabic labels, reference rail spacing and media-specific framing. Rebuilt header/nav/rail, retained local-only meanings, and added metadata/container-based fitting. Final label-width check at 359px found no overflow in all five controls. Portrait/landscape both play. Final evidence: `tt-comparison.jpg`, `tt-details.jpg`, `tt-landscape.jpg`.
4. [P2, corrected] IG double-tap lifetime was 800ms and started golden; source first-heart window is approximately 670ms with purple/pink. Changed to 670ms and sampled actual CSS at 0/134/500/670ms. TT save now includes the delayed ring and squash observed in source frames. See `motion-css-timeline.jpg`; these are paused keyframe samples, not live screen recordings or performance measurements.
5. [P2, corrected] Browser scroll anchoring left an old TT sample visible after import. The feed now suppresses anchoring and reveals the first newly inserted post; keyboard paging works. Empty attachment preview src warned in React; now omitted until ready.
6. [P2, corrected] Requested arbitrary X accent could affect text contrast. Added validated HEX/native picker/presets and persistent preference; choose higher-contrast black/white button text and a subtle compose outline. Purple survived actual browser reload; tests cover legacy values, arbitrary colors, invalid partial input and note preservation.

## Required fidelity surfaces

- Typography: checked Latin/Arabic, 16px/21px note text, 17px TT tabs, 27px IG system wordmark, mixed-direction handles, long-text wrapping. Proprietary font differences remain expected P3, not claimed exact.
- Spacing/layout: compared full and focused regions at normalized equal size. IG media 360×480, post header 56; X header 54 + tabs 46; TT nav 52 and rail bottom 14. No horizontal root/nav overflow at checked widths.
- Colors/tokens: IG near-black blue-gray, X default orange or custom choice scoped to X; TT red/yellow and correct settled SVG fill verified. Native brand accents are approximate. Dark-mode inheritance is preserved.
- Image quality/assets: retained existing licensed/bundled gallery images and Lucide. No new proprietary image/font import or generated social-content substitution. Single composite remains one img at 800×540. Media subjects and story seen/followed states differ by design. XLogo is the pre-existing asset.
- Copy/content: Arabic names صور / فيديوهات / ملاحظات unchanged; TT nav expanded to full source labels. Local filters replace unrelated geographic/topics; unavailable social services say so. Dynamic source post copy/counts are not copied.

## Primary interaction evidence

- 31 Vitest checks plus typecheck/lint/build. Existing quota and IndexedDB-v1 upgrade tests pass.
- Browser: IG double-tap, unlike, saved state, real carousel to 2/2 in RTL, comments/Escape, Stories; TT portrait/landscape playback, like/unlike, yellow save/un-save, local comment, keyboard paging/import; X image/video reload, safe replacement, expand/collapse, custom color persistence.
- Switcher: five closes from each platform, 15 total, no remaining layers, correct restored focus; browser Back closes without navigation away. Prior backdrop tests remain.
- Reduced motion: CSS override and simulated matchMedia path checked; physical OS preference not changed. Android/TalkBack, finger gesture sampling, FPS profiling and local file opening on Android remain untested.
- Console: empty-src warning fixed; after reload no new application error. Browser-extension metadata errors and unavailable external sample videos are disclosed separately.

## Residual P3 / expected differences

Open-source/system typography and Lucide stroke/shape differ slightly. Native notification badges, social subscriptions, Grok, geographic feeds and Threads promotions are intentionally absent. Dynamic counts and source video aspect ratio differ. Black-bar geometry follows each actual video, not the screenshot's content. No live synchronized recording is claimed. User visual acceptance remains required before merge/deployment.

## Implementation checklist

- [x] Rebuild three existing platforms, preserve V3 persistence/attachments/switcher.
- [x] Compare full views and detailed regions, fix P1/P2 findings and recapture.
- [x] Verify motion samples, real interactions, two phone sizes and no destructive migration.
- [x] Prepare optional standalone HTML review artifact without production deployment.
- [x] Keep the same V3 branch and open PR; no merge/publish.

final result: passed
