# ModKit Swatch

A client-side web app for Gundam and scale model kit builders. Upload a reference photo, click anywhere on the image to sample a color, and get ranked paint matches across major hobby paint brands.

## Features

- **Image Upload** — Drag-and-drop or click to browse (JPEG, PNG, WebP)
- **Canvas Color Picker** — Click any pixel to sample its color
- **Delta E Matching** — CIE2000 color difference ranking against 300+ hobby paints
- **Multi-Brand Support** — Mr. Color, Tamiya, Gaianotes, Jumpwind
- **Filters** — Filter results by brand, finish, and paint type
- **Saved Palette** — Save picks to a palette, export as text to clipboard

## Tech Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- `chroma-js` for color math
- Fully static — no backend required

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Paint Database

Paint data lives in `data/paints.json`. Add new entries with this shape:

```json
{
  "brand": "Mr. Color",
  "code": "C5",
  "name": "Blue",
  "hex": "#1030a0",
  "finish": "gloss",
  "type": "lacquer"
}
```

Brands, finishes, and types are derived from the data at runtime — no code changes needed to add new values.
