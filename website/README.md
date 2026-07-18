# Roomfile website

The public marketing site, documentation, and fictional apartment case study
for Roomfile. It runs on the Sites React/TypeScript runtime with Vinext and
collects no accounts, uploads, analytics, or personal data.

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
- `public/` contains fictional Banana renders, social artwork, and the favicon.
- `.openai/hosting.json` binds this folder to its permanent Sites project.
- `worker/` and `build/` provide the Vinext/Sites runtime entry points.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build every route and verify the public content contracts

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
