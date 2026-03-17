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

type Marker = {
  id: number;                    // Auto-incrementing ID
  x: number;                     // X position on canvas (image coords)
  y: number;                     // Y position on canvas (image coords)
  hex: string;                   // Sampled color at this position
  assignedPaint: PaintMatch | null;  // The paint assigned to this marker
};
```

## Marker System

The core interaction model is a multi-marker system. Users click on the image to
place markers, each of which samples a color and can be assigned a matching
paint.

### Marker Lifecycle

1. **Click image** - Creates a new `Marker` with sampled hex color at (x, y).
   Any previous unassigned marker is removed.
2. **View results** - The active marker's hex is matched against the paint
   database. Top 10 results are shown.
3. **Assign paint** - User selects a paint from results. The marker's
   `assignedPaint` field is set.
4. **Canvas rendering** - Assigned markers show a dot, label card (brand + code
   - name), and connector line. The active unassigned marker shows a crosshair.
5. **Remove/clear** - Individual markers can be removed, or all cleared at once.

### Marker States

| State                | Visual                                     |
| -------------------- | ------------------------------------------ |
| Active + unassigned  | Crosshair reticle with colored ring        |
| Active + assigned    | Dot + label card with sky-blue border      |
| Inactive + assigned  | Dot + label card with subtle border        |
| Inactive + unassigned| Not rendered (cleaned up on next click)    |

## Finish Values

| Value         | Description                           |
| ------------- | ------------------------------------- |
| `gloss`       | High shine, smooth finish             |
| `flat`        | No shine, matte finish                |
| `semi-gloss`  | Partial shine                         |
| `metallic`    | Metallic/reflective finish            |
| `clear`       | Transparent tint (not a base coat)    |

## Paint Type Values

| Value                  | Description                        |
| ---------------------- | ---------------------------------- |
| `lacquer`              | Solvent-based lacquer              |
| `acrylic`              | Standard acrylic                   |
| `enamel`               | Enamel paint                       |
| `water-based acrylic`  | Water-based acrylic (e.g. QNC)     |

## localStorage Persistence

The app persists state to localStorage under two keys:

| Key                       | Contents                                   |
| ------------------------- | ------------------------------------------ |
| `modkitswatch_markers`    | JSON array of `Marker` objects             |
| `modkitswatch_image`      | Base64 data URL of the uploaded image      |

On page load, markers and the image are restored from localStorage so the user
can continue where they left off.

## Image Export

The canvas can be exported as a PNG via the export button. The export:

1. Draws the original image on an offscreen canvas
2. Renders all assigned marker labels and connector lines (no active highlight)
3. Samples the watermark region to determine background luminance
4. Overlays a semi-transparent watermark (light or dark variant based on
   background brightness)
5. Triggers a download of `modkitswatch-export.png`

## Mobile UX

On touch devices, the app provides:

- **Pick/Scroll mode toggle**: A button on the canvas switches between color
  picking mode (touch picks a color) and scroll mode (touch scrolls the page).
- **MobileBottomSheet**: After picking a color on mobile (screen width < 1024),
  a bottom sheet slides up with filters and paint results. It supports drag-to-
  dismiss and auto-closes when a paint is assigned.

## Next Steps

- [Overview](01-overview.md)
- [Paint Database](../03-paint-database/README.md)
