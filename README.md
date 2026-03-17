# ModKit Swatch

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)
![chroma-js](https://img.shields.io/badge/chroma--js-3-FF6B6B?style=flat-square)
[![License](https://img.shields.io/github/license/afzafri/modkit-swatch?style=flat-square)](LICENSE)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fmodkitswatch.afifzafri.com&style=flat-square&label=demo)](https://modkitswatch.afifzafri.com)

> Find the perfect paint match for your Gunpla, Gundam model kit, or any scale model.

Upload a reference photo, click to sample any color, and instantly get ranked paint matches across major hobby brands.

![ModKit Swatch](docs/screenshot.png)

## Features

- Upload any reference image (JPEG, PNG, WebP) via drag-and-drop or file browser
- Click anywhere on the image to sample a color, with a magnifier loupe for precision
- Place multiple markers and assign paints to each one
- CIE2000 Delta E color matching across 600+ hobby paints
- Metallic surface detection via pixel variance analysis
- Filter by brand, finish (gloss, flat, semi-gloss, metallic), and paint type
- Paint bottle/swatch images shown alongside results
- Export annotated image as PNG with branded watermark
- Copy paint assignments list to clipboard
- Mobile bottom sheet for paint selection on touch devices
- Fully client-side, no backend or signup required

## Export

Annotate your reference photo with paint assignments and export it as a PNG. The exported image includes all marker labels with brand, code, and paint name, plus a watermark that automatically adapts between light and dark based on the background.

## Supported Brands

Mr. Color, Tamiya, Gaianotes, Jumpwind (Meka & Neo), Hobby Mio, QNC, Sunin7

## Quick Start

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Tech Stack

- **Next.js** (App Router), TypeScript, Tailwind CSS
- **chroma-js** for color math (hex/rgb/lab conversions, Delta E CIE2000)
- **lucide-react** for icons
- Fully static, deployable to Vercel or any static host

## Paint Database

Paint data lives in `data/paints.json`. Each entry looks like this:

```json
{
  "brand": "Mr. Color",
  "code": "C5",
  "name": "Blue",
  "hex": "#1030a0",
  "finish": "gloss",
  "type": "lacquer",
  "suitableFor": { "airbrush": true, "handPainting": false }
}
```

Brands, finishes, and types are derived from the data at runtime. No code changes needed to add new values.

### Paint Images

Place paint images in `public/paints/{brand-slug}/{code}.jpg`. The app automatically looks for a matching image and falls back to a hex color swatch if none exists.

## Documentation

Full documentation is available in [`docs/`](docs/README.md).

| Topic | Link |
|-------|------|
| Architecture and how it works | [docs/01-architecture](docs/01-architecture/README.md) |
| Getting started | [docs/02-development/01-getting-started.md](docs/02-development/01-getting-started.md) |
| Paint database format | [docs/03-paint-database/01-data-format.md](docs/03-paint-database/01-data-format.md) |
| Adding new paints | [docs/03-paint-database/02-adding-paints.md](docs/03-paint-database/02-adding-paints.md) |

## License

This project is licensed under the `MIT license` - see the `LICENSE` file for details.
