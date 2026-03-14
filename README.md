# ModKit Swatch

A client-side web app for Gundam and scale model kit builders. Upload a reference photo, click anywhere on the image to sample a color, and get ranked paint matches across major hobby paint brands.

## Features

- **Image Upload** — Drag-and-drop or click to browse (JPEG, PNG, WebP)
- **Canvas Color Picker** — Click any pixel to sample its color, with magnifier loupe for precision
- **Delta E Matching** — CIE2000 color difference ranking against 580+ hobby paints
- **Multi-Brand Support** — Mr. Color, Tamiya, Gaianotes, Jumpwind (Meka & Neo series), Hobby Mio, QNC, Sunin7
- **Paint Images** — Bottle/swatch photos for Mr. Color, Tamiya, Gaianotes, and Jumpwind
- **Filters** — Filter results by brand, finish, and paint type
- **Clear Paint Filter** — Hides transparent/clear paints by default (toggleable)
- **Saved Palette** — Save picks to a palette, export as text to clipboard
- **Fully Static** — No backend required, all processing runs client-side

## Tech Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- `chroma-js` for color math
- Fully static — deployable to Vercel or any static host

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Paint Database

587 paints across 7 brands in `data/paints.json`. Add new entries with this shape:

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

### Paint Images

Place paint images in `public/paints/{brand-slug}/{code}.jpg`. The app automatically looks for a matching image and falls back to a hex color swatch if none is found.
