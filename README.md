# Remy Relics web

Standalone, mobile-first archive storefront foundation. This repository is currently limited to PASS 00: contracts, routes, local canonical assets, and verification infrastructure. Canonical screens are intentionally not implemented yet.

## Source authority

- [Frozen Figma/Codex handoff](https://www.figma.com/design/V1WXFOR0Gob6lBc14cbmba/Dojo-Jewelry-%C2%B7-Field-Folio-01?node-id=656-133)
- Figma engineering manifest `660:211`
- [Notion product/data canon](https://app.notion.com/p/3c8c0ba0753a812b8750c47abcf8ab27?pvs=204)

The application code points back to those sources; this README is not a replacement specification.

## Architecture

- Next.js App Router + TypeScript, with `src/app` kept route-focused
- global Figma variables in `src/design/tokens.css`; component styling uses CSS Modules
- product/data, asset, commerce, inspection-log, motion, and SEO contracts in dedicated `src` modules
- Vitest for pure contract/storage tests
- Playwright with a fixed 390 × 844 project for route and visual regression checks

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:visual
```

Set `NEXT_PUBLIC_SITE_URL` to the production origin before deployment. PASS 00 remains `noindex`; that gate must be removed only when implemented screens are ready to ship.
