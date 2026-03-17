# Overview

ModKit Swatch is a fully client-side Next.js application. All processing happens in the
browser with no backend required.

## Tech Stack

| Layer      | Choice                           |
| ---------- | -------------------------------- |
| Framework  | Next.js (App Router)             |
| Language   | TypeScript                       |
| Styling    | Tailwind CSS                     |
| Color math | `chroma-js`                      |
| Icons      | `lucide-react`                   |
| Paint data | Local JSON (`data/paints.json`)  |
| Deployment | Vercel (static export)           |

## Project Structure

```text
app/
  page.tsx              - Main matcher page (multi-marker workflow)
  paints/page.tsx       - Paint database browser page
  layout.tsx            - Root layout with metadata, fonts, JSON-LD
  globals.css           - Global styles, font imports, slide animations

components/
  ImageCanvas.tsx       - Image upload, canvas rendering, marker drawing,
                          loupe magnifier, pick/scroll mode, PNG export
  ColorSwatch.tsx       - Displays picked HEX and RGB values for active marker
  FilterBar.tsx         - Brand, finish, type filter dropdowns
  ResultsList.tsx       - Ranked paint match cards
  PaintCard.tsx         - Individual paint result card with assign button
  AssignmentsPanel.tsx  - Lists all markers with assigned paints, clipboard
                          export, clear all
  MobileBottomSheet.tsx - Slide-up paint selection sheet for mobile devices
  SiteHeader.tsx        - Shared navigation header with paint count badge
  SiteFooter.tsx        - Shared footer

lib/
  colorMath.ts          - hex/rgb/lab conversions, deltaE, contrast,
                          sampleRegion, computeRGBVariance, detectMetallic
  matcher.ts            - matchPaints(), extractFilterOptions(), isClearPaint()

types/
  paint.ts              - Paint, PaintWithLab, PaintMatch, Filters, Marker

data/
  paints.json           - Full paint database

public/
  paints/{brand}/       - Paint bottle/swatch images
  watermark.svg         - Dark watermark for light backgrounds (export)
  watermark-light.svg   - Light watermark for dark backgrounds (export)
```

## Key Design Decisions

- **Fully client-side**: No API calls, no server processing. The entire paint
  database is loaded into memory on page load and Lab values are precomputed
  once.
- **Multi-marker system**: Users place multiple markers on the image, each with
  an independently assigned paint. Markers are drawn directly on the canvas with
  labels showing brand, code, and name connected by lines.
- **Data-driven types**: Brand, finish, and type values are plain strings derived
  from `paints.json` at runtime. No hardcoded TypeScript enums. Adding a new
  brand or finish requires only a JSON change.
- **Image fallback**: Paint cards attempt to load a bottle image from
  `public/paints/{brand-slug}/{code}.jpg`. If missing, the hex color swatch is
  shown instead.
- **Metallic detection**: The app samples a 7x7 pixel region and measures RGB
  variance to detect reflective surfaces, auto-toggling the metallic filter.

## Pages

| Route    | Purpose                                            |
| -------- | -------------------------------------------------- |
| `/`      | Main color matcher with multi-marker workflow      |
| `/paints`| Browse and search all paints in the database       |

## Next Steps

- [Color Matching Pipeline](02-color-matching.md)
- [Data Model](03-data-model.md)
