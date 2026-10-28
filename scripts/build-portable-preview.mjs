import { build } from "vite";
import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { resolve, join } from "node:path";

// Optional review artifact. The normal production build and routing stay unchanged.
const entry = ".portable-entry.jsx";
const html = ".portable-entry.html";
const outDir = ".portable-build";
const destination = resolve(process.argv[2] || "social-gallery-v3-preview.html");
try {
  await writeFile(
    entry,
    `import React from 'react';
import {createRoot} from 'react-dom/client';
import {RouterProvider, createMemoryHistory} from '@tanstack/react-router';
import {getRouter} from './src/router';
import './src/styles.css';
const router = getRouter();
router.update({history:createMemoryHistory({initialEntries:['/']})});
createRoot(document.getElementById('root')).render(React.createElement(RouterProvider,{router}));`,
  );
  await writeFile(
    html,
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Social Gallery V3 · portable review</title></head><body><div id="root"></div><script type="module" src="/.portable-entry.jsx"></script></body></html>',
  );
  await build({
    configFile: resolve("vite.config.ts"),
    base: "./",
    build: {
      outDir,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      modulePreload: false,
      rolldownOptions: { input: resolve(html), output: { format: "es", codeSplitting: false } },
    },
  });
  const files = await readdir(join(outDir, "assets"));
  const js = await readFile(
    join(
      outDir,
      "assets",
      files.find((f) => f.endsWith(".js")),
    ),
    "utf8",
  );
  const cssFile = files.find((f) => f.endsWith(".css"));
  const css = cssFile ? await readFile(join(outDir, "assets", cssFile), "utf8") : "";
  if (/\bimport\s*\(/.test(js))
    throw new Error("Unexpected external dynamic import in portable bundle");
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#000000"><title>Social Gallery V3 · portable review</title><style>${css.replaceAll("</style", "<\\/style")}</style></head><body><div id="root"></div><script type="module">${js.replaceAll("</script", "<\\/script")}</script></body></html>`;
  await mkdir(resolve(destination, ".."), { recursive: true });
  await writeFile(destination, page);
  console.log(`Portable review saved: ${destination}`);
} finally {
  await rm(entry, { force: true });
  await rm(html, { force: true });
  await rm(outDir, { recursive: true, force: true });
}
