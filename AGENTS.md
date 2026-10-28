# Social Gallery

This is an independent React + TypeScript + Vite website. GitHub is the source of truth.

Preserve existing gallery behavior, branding, localStorage key `social-gallery-v1`, and IndexedDB database `social-gallery-media`. Never upload private media automatically.

Keep photo, video and text-note views separate. Develop and polish the website first; Android packaging and native MediaStore integration come after web acceptance. Do not add Lovable dependencies or telemetry.

Before shipping changes run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. The static output is `dist/`. Do not hand-edit `src/routeTree.gen.ts`; Vite generates it.
