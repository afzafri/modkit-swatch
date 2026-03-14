# ModKit Swatch — Gunpla Paint Color Matcher

## Project Overview
A client-side web app for Gundam/scale model kit builders. Upload a reference photo, click to sample colors, get ranked paint matches across hobby paint brands using Delta E (CIE2000) color matching.

## Tech Stack
- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- `chroma-js` for color math (hex/rgb/lab conversions, deltaE CIE2000)
- All processing is client-side — no backend needed

## Architecture
- `types/paint.ts` — Paint, PaintWithLab, PaintMatch, Filters types (string-based, not hardcoded enums — brands/finishes/types are derived from paints.json at runtime)
- `lib/colorMath.ts` — hex/rgb/lab conversions, deltaE, contrast color
- `lib/matcher.ts` — matchPaints() + extractFilterOptions() from data
- `data/paints.json` — full paint database (300+ entries across Mr. Color, Tamiya, Gaianotes, Jumpwind)
- `components/` — ImageCanvas, ColorSwatch, FilterBar, ResultsList, PaintCard, Palette
- `app/page.tsx` — main page (client component), precomputes Lab values on load

## Key Design Decisions
- Brand/finish/type values are plain strings derived from paints.json, NOT hardcoded TypeScript union types — allows adding new brands/finishes by just updating the JSON
- Paint Lab values are precomputed once on app load, not per-click
- Palette persists in localStorage under key `gpm_palette`
- The `/scripts/` directory contains the scraper tool — it is a SEPARATE tool, NOT part of the main app. Do not include it in builds or git pushes.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint

## Notes
- CSS/styling is minimal POC — frontend library TBD by user
- Spec file: SPEC_gunpla-paint-matcher.md (reference only, not part of the app)
