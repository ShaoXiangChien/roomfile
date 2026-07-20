# Roomfile website

The public marketing site, documentation, fictional case studies, and
research-led Style Atlas for Roomfile. It runs on the Sites React/TypeScript
runtime with Vinext and collects no accounts, uploads, analytics, or personal
data.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included shape

- `app/` contains all public routes and the launch-asset renderer.
- `app/generated/style-atlas.json` is committed output synchronized from the
  portable skill Atlas.
- `public/` contains fictional Banana renders, synchronized licensed Atlas
  imagery, social artwork, and the favicon.
- `.openai/hosting.json` binds this folder to its permanent Sites project.
- `worker/` and `build/` provide the Vinext/Sites runtime entry points.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm run build:vercel`: verify the standard Next.js build used by Vercel;
  run `npm run sync:styles:check` from the repository before deploying
- `npm test`: build every route and verify the public content contracts
- `npm run sync:styles`: regenerate public Atlas data and images
- `npm run sync:styles:check`: fail when public Atlas output has drifted

## Deployment targets

- OpenAI Sites uses the existing Vinext/Vite/Cloudflare Worker build.
- Vercel uses `vercel.json` and the standard Next.js build. Run
  `vercel --prod` from this directory after authenticating with the Vercel CLI.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
