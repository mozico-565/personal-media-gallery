# Social Gallery V2 validation

Base commit: `edc3da518f95478859525d6c5354374c82997ad6`.

## Implemented

- Separate photo/video/note collections across feeds, search, profiles, stories and saved views. Instagram's video Reels entry is replaced by Saved photos.
- Text note creation, editing, deletion, quotes, reply threads, simulated reposts, likes, bookmarks, and persistent draft. Existing V1 likes/comments/preferences remain under the same storage key.
- File picker import for images and videos, saved in IndexedDB. Imported media uses the local user's profile and zero initial activity counts. No upload, account or external AI integration.
- Mode views remain mounted to preserve scroll, tab and profile state while switching. Video playback checks active mode and page visibility; only intersecting slides play. Includes seek control, autoplay fallback and missing/unsupported-media message.
- Sheets have close controls, Escape handling, focus containment/restoration and swipe-down handle dismissal. Reduced-motion styles and keyboard focus indicators are supported.
- Photo options include full-photo album viewer and hide-in-app action. Caption sharing uses the device share sheet, with clipboard fallback and failure feedback.
- Added CI using npm's lockfile for reproducible TypeScript, lint, test and build checks. Existing bun.lock is retained for the Lovable project.

## Local checks

| Check | Result |
| --- | --- |
| `npm test` | 12 tests passed in 2 files |
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed, client + SSR + Cloudflare worker output |
| `npm run lint` | No errors; 7 Fast Refresh export warnings |
| `git diff --check` | Passed |

Tests cover content separation, V1 persistence migration, Arabic document direction, malformed stored fields, note edit/quote/delete/reload, persistent drafts, text-only X UI, deletion inside an open thread, Escape/focus restoration, photo/video rendered separation, comments/likes/saves, IndexedDB import/restore, unsupported import rejection and storage failure reporting.

## Visual audit and remaining checks

1. Lovable editor/preview: blocked by the cloud browser's missing project access. No visual audit claimed.
2. Local preview: dev server starts successfully, but the cloud browser cannot connect to this workspace's localhost (connection refused). No before/after screenshots were captured.
3. Current official platform references: not captured or compared. No pixel-perfect or 100% fidelity claim.

The DOM/component tests use jsdom and fake IndexedDB. They do not prove device media decoding, real audio, touchscreen gestures, visual layout, keyboard avoidance, browser storage quotas, or native Android integration. Multi-size Arabic/English screenshots, physical-device playback/import, native sharing, swipe testing and a console review in a real browser remain necessary before considering the visual-polish brief fully accepted.

Existing secondary demo controls still explicitly show planned/unavailable/simulated notices, including profile editing and inbox actions. Those do not connect to real social accounts. Automatic Android media discovery and real AI are not implemented.

No public deployment was performed. The work is proposed on a separate branch; Lovable's connected main branch is unchanged until merge.
