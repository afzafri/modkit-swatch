# Data Format

The paint database lives in `data/paints.json` as a JSON array of paint objects.

## Paint Entry Schema

```json
{
  "brand": "Mr. Color",
  "code": "C5",
  "name": "Blue",
  "hex": "#1030a0",
  "finish": "gloss",
  "type": "lacquer",
  "suitableFor": {
    "airbrush": true,
    "handPainting": false
  }
}
```

## Field Reference

| Field | Type | Required | Description |
| ---------------------------- | ------- | -------- | ------------------------------------------------------------ |
| `brand` | string | Yes | Paint brand name |
| `code` | string | Yes | Product code (e.g. "C5", "XF-8", "MC51") |
| `name` | string | Yes | Paint color name |
| `hex` | string | Yes | Hex color code, 6-digit lowercase with `#` prefix |
| `finish` | string | Yes | One of: `gloss`, `flat`, `semi-gloss`, `metallic`, `clear` |
| `type` | string | Yes | One of: `lacquer`, `acrylic`, `enamel`, `water-based acrylic` |
| `suitableFor` | object | Yes | Application method suitability |
| `suitableFor.airbrush` | boolean | Yes | Whether this paint is suitable for airbrush |
| `suitableFor.handPainting` | boolean | Yes | Whether this paint is suitable for hand painting |

## Supported Brands

| Brand | Code Prefix | Type | Paint Count |
| ---------- | --------------- | ------------------- | ----------- |
| Mr. Color | C | Lacquer | ~130 |
| Tamiya | X, XF, LP | Acrylic/Lacquer | ~110 |
| Gaianotes | Numeric, Ex, GP | Lacquer | ~150 |
| Jumpwind | JW, MC | Lacquer | ~100 |
| Hobby Mio | HM | Lacquer | ~45 |
| Sunin7 | Numeric, J | Lacquer | ~30 |
| QNC | QNC | Water-based acrylic | ~10 |

## Paint Images

Paint images are stored in `public/paints/{brand-slug}/{code}.jpg`.

| Brand | Slug | Image Path Example |
| ---------- | ------------ | ------------------------------------- |
| Mr. Color | `mr-color` | `public/paints/mr-color/C5.jpg` |
| Tamiya | `tamiya` | `public/paints/tamiya/X-7.jpg` |
| Gaianotes | `gaianotes` | `public/paints/gaianotes/001.jpg` |
| Jumpwind | `jumpwind` | `public/paints/jumpwind/MC51.jpg` |
| Hobby Mio | `hobby-mio` | `public/paints/hobby-mio/HM-003.jpg` |
| Sunin7 | `sunin7` | `public/paints/sunin7/041.jpg` |

The app attempts to load the image and falls back to a hex color swatch if the file does not exist.

## Excluded Paint Types

The database should not include:

- Topcoats (gloss/matte/semi-gloss clear coats)
- Primers and surfacers
- Thinners and retarders
- Flat base additives

Only actual colored paints belong in the database.

## Next Steps

- [Adding Paints](02-adding-paints.md)
- [Scraper Tools](../02-development/02-scraper-tools.md)
