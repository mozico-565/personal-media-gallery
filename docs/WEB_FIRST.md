# Web-first development

The website is the active product. Keep the current identity and functioning features; implement and test incremental improvements here before Android work.

## Standalone architecture

- Vite + React client entry: `index.html` and `src/main.tsx`.
- Official TanStack Router Vite plugin generates `src/routeTree.gen.ts`.
- Root route provides existing query/router error boundaries; app routes and gallery logic are preserved.
- No Lovable package, telemetry hooks, project manifest, SSR or Nitro deployment is required.
- Build output: `dist/`; hosting is replaceable and does not own the application code.
- npm and `package-lock.json` are the single package-manager source.

## Acceptance before Android

Check small/medium/large mobile viewports, Arabic and English, dark mode, content separation, import/reload, note CRUD/drafts/quotes/replies, photo albums, video playback/mute/seek, gestures, keyboard avoidance and accessibility. Compare motion/layout to approved references without claiming unmeasured pixel accuracy.

Storage stays local to each website origin. Moving hosting changes that origin. Never assume notes or imported blobs migrate automatically, and never delete the old site's browser storage during migration.

## Android later

Once web acceptance is complete, preserve the same UI and introduce a native gallery repository (MediaStore) and permission handling. Native media auto-discovery, partial-access behavior and physical-device performance require separate Android implementation and validation.
