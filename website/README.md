# AI Watermark Remover website

This folder contains the independent public frontend for the forked Gemini watermark-removal engine.

## Local build

```bash
pnpm install --frozen-lockfile
pnpm build:site
```

The Cloudflare Pages output directory is `site-dist`.

## Cloudflare Pages settings

- Framework preset: None
- Build command: `pnpm install --frozen-lockfile && pnpm build:site`
- Build output directory: `site-dist`
- Root directory: blank
- Production branch: `main`

The build first creates the upstream engine's static video runtime, removes the two JSEP runtime files that exceeded Cloudflare Pages' per-file upload limit in the prior deployment, then bundles the independent image frontend and copies the video page and its model/runtime assets.

## Scope and limitations

- Image processing imports the fork's browser SDK directly and is intended for supported visible Gemini watermarks.
- The video route reuses the repository's existing video preview application. Its UI is currently upstream's Chinese-language preview and needs a proper English/product pass before broad public promotion.
- Batch image processing is sequential. The ZIP download loads fflate from jsDelivr when the user requests an archive.
- No account, server upload, payment or analytics system is included.
- Test image and video processing on real files and supported browsers before advertising the tool as production-ready.

## Attribution and legal

The engine remains under the upstream repository's MIT license. Preserve its license and attribution notices. This independent website is not affiliated with Google or Gemini. Users are responsible for ensuring they have permission to modify any media they process.
