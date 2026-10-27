# Social Gallery

An independent, personal React + TypeScript + Vite website. Lovable provided the initial foundation; the project no longer needs its editor, build configuration, telemetry, or hosting. GitHub is the source of truth.

## Product roadmap

1. **Current: website.** Refine Instagram photos, TikTok videos and X text notes; test mobile layouts, Arabic/RTL, motion, storage and all interactions.
2. **After web acceptance: Android.** Package the stable web UI (for example with Capacitor), add native MediaStore access and Android permissions, and build/test APK releases. Native work has not started.

## Development

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The self-contained static build is `dist/`. Serve it using an HTTPS static host with single-page-app fallback to `index.html`. There is no SSR server or Lovable runtime. The existing TanStack Router and all gallery components are retained.

## Data and privacy

- Instagram shows photos/albums; TikTok shows videos; X shows private text notes.
- Import device media with the add buttons or Settings. Media is stored in IndexedDB on this browser, never uploaded by the app. Notes, drafts and reactions use localStorage.
- Browser storage is tied to the website origin. Data on the old Lovable domain does not automatically appear on a new domain. Keep the old origin until important content has been copied; original phone media can be selected again.
- Clearing site data removes locally stored notes and imported copies. Hiding a photo never deletes the original device file.
- Android automatic gallery discovery and real AI personalities remain unimplemented. Demo clips and Google Fonts need internet; this version does not claim full offline loading.

## Validation

The existing V2 behavior suite contains 12 passing tests. See `docs/V2_VALIDATION.md` for its scope and physical-device checks still needed. Current standalone build, type checking and tests pass; a live visual review is still required.
