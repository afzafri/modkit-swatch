# Overview

ModKit Swatch is a fully client-side Next.js application. All processing happens in the browser with no backend required.

## Tech Stack

| Layer | Choice |
| --------- | -------------------------------- |
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Color math | `chroma-js` |
| Icons | `lucide-react` |
| Paint data | Local JSON (`data/paints.json`) |
| Deployment | Vercel (static export) |

## Project Structure

```text
app/
  page.tsx              - Main matcher page (client component)
  paints/page.tsx       - Paint database browser page
  layout.tsx            - Root layout with metadata and fonts
  globals.css           - Global styles, font imports

components/
  ImageCanvas.tsx       - Image upload, canvas pixel picker, magnifier loupe
  ColorSwatch.tsx       - Displays picked HEX and RGB values
  FilterBar.tsx         - Brand, finish, type filter dropdowns
  ResultsList.tsx       - Ranked paint match cards
  PaintCard.tsx         - Individual paint result card
  Palette.tsx           - Saved palette with clipboard export
  SiteHeader.tsx        - Shared navigation header
  SiteFooter.tsx        - Shared footer

lib/
  colorMath.ts          - hex/rgb/lab conversions, deltaE, contrast
  matcher.ts            - matchPaints(), extractFilterOptions(), isClearPaint()

types/
  paint.ts              - Paint, PaintWithLab, PaintMatch, Filters types

data/
  paints.json           - Full paint database

public/
  paints/{brand}/       - Paint bottle/swatch images
```

## Key Design Decisions

- **Fully client-side**: No API calls, no server processing. The entire paint database is
  loaded into memory on page load and Lab values are precomputed once.
- **Data-driven types**: Brand, finish, and type values are plain strings derived from
  `paints.json` at runtime. No hardcoded TypeScript enums. Adding a new brand or finish
  requires only a JSON change.
- **Image fallback**: Paint cards attempt to load a bottle image from
  `public/paints/{brand-slug}/{code}.jpg`. If missing, the hex color swatch is shown
  instead.

## Pages

| Route | Purpose |
| -------- | ----------------------------------- |
| `/` | Main color matcher tool |
| `/paints` | Browse all paints in the database |

## Next Steps

- [Color Matching Pipeline](02-color-matching.md)
- [Data Model](03-data-model.md)
