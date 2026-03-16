# Data Model

Types and data structures used throughout the application.

## Paint Types

Defined in `types/paint.ts`:

```typescript
type Paint = {
  brand: string;      // e.g. "Mr. Color", "Tamiya"
  code: string;       // e.g. "C5", "XF-8", "MC51"
  name: string;       // e.g. "Blue", "Flat Blue"
  hex: string;        // e.g. "#1030a0" (6-digit, lowercase)
  finish: string;     // "gloss", "flat", "semi-gloss", "metallic", "clear"
  type: string;       // "lacquer", "acrylic", "enamel", "water-based acrylic"
  suitableFor: {
    airbrush: boolean;
    handPainting: boolean;
  };
};

type PaintWithLab = Paint & {
  lab: { L: number; a: number; b: number };
};

type PaintMatch = PaintWithLab & {
  deltaE: number;
};

type Filters = {
  brand: string;   // "All" or a brand name
  finish: string;  // "All" or a finish value
  type: string;    // "All" or a type value
};
```

## Finish Values

| Value | Description |
| ------------- | ------------------------------------- |
| `gloss` | High shine, smooth finish |
| `flat` | No shine, matte finish |
| `semi-gloss` | Partial shine |
| `metallic` | Metallic/reflective finish |
| `clear` | Transparent tint (not a base coat) |

## Paint Type Values

| Value | Description |
| ---------------------- | ---------------------------------- |
| `lacquer` | Solvent-based lacquer |
| `acrylic` | Standard acrylic |
| `enamel` | Enamel paint |
| `water-based acrylic` | Water-based acrylic (e.g. QNC) |

## Palette Persistence

The saved palette is stored in `localStorage` under the key `gpm_palette` as a JSON array of `PaintWithLab` objects.

## Next Steps

- [Overview](01-overview.md)
- [Paint Database](../03-paint-database/README.md)
