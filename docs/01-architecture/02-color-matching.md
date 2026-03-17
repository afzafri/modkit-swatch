# Color Matching

How ModKit Swatch matches a sampled color to the closest hobby paints.

## Pipeline

```text
User clicks image
  -> sampleRegion(ctx, x, y, 3) reads a 7x7 pixel grid and averages RGB
  -> rgbToHex(avgR, avgG, avgB) converts averaged color to hex string
  -> computeRGBVariance(pixelData) measures color variance across the region
  -> hexToLab(hex) converts to CIE L*a*b* color space
  -> detectMetallic(lab, variance) returns "high" | "medium" | "none"
  -> deltaE(pickedLab, paintLab) computes CIE2000 distance for each paint
  -> Sort by deltaE ascending (lowest = closest match)
  -> Return top 10 results
```

## Region Sampling

Instead of reading a single pixel, the app samples a 7x7 grid centered on the
click point (`sampleRegion()` in `colorMath.ts`). The RGB channels are averaged
to produce a more stable color reading. The raw pixel data is also used to
compute RGB variance for metallic detection.

## CIE2000 Delta E

Delta E (CIE2000) measures perceptual color difference. It accounts for how the
human eye perceives color differences across different regions of the color
space. Lower values mean colors are more similar.

| Delta E Range | Perception                                         |
| ------------- | -------------------------------------------------- |
| < 2           | Nearly identical to the eye                        |
| 2 to 5        | Good match, slight difference visible side-by-side |
| 5 to 10       | Fair match, noticeable difference                  |
| > 10          | Rough match, clearly different                     |

The app uses `chroma.deltaE()` from the `chroma-js` library, which implements
CIE2000.

## Lab Precomputation

On app load, all paints in the database are mapped once to attach precomputed
L\*a\*b\* values:

```typescript
const paints = paintsData.map((p) => ({
  ...p,
  lab: hexToLab(p.hex),
}));
```

This runs once per page load, not per click. Matching is synchronous and
completes within milliseconds.

## Metallic Detection

The app automatically detects reflective/metallic surfaces using a two-step
heuristic in `colorMath.ts`:

1. **`computeRGBVariance(pixelData)`** - Computes mean variance across R, G, B
   channels from the 7x7 sample region. High variance suggests a non-uniform,
   reflective surface.

2. **`detectMetallic(lab, variance)`** - Combines variance with a brightness
   heuristic:
   - Variance > 800: returns `"high"` (strong metallic signal)
   - Variance > 200 with bright neutral color (L > 70, low chroma): `"high"`
   - Variance > 200 otherwise: `"medium"`
   - Below thresholds: `"none"`

When the signal is `"high"`, the app auto-enables the metallic-only filter.
Users see a hint banner and can dismiss it to restore normal matching.

## Filtering

Filters are applied before scoring. The matcher filters paints by brand, finish,
and type, then scores only the remaining paints. The `excludeClear` flag uses the
`finish === "clear"` field to hide transparent paints from results. When
`metallicOnly` is true, only paints with `finish === "metallic"` are included.

## Key Files

- `lib/colorMath.ts` - `hexToLab()`, `deltaE()`, `rgbToHex()`,
  `getContrastColor()`, `sampleRegion()`, `computeRGBVariance()`,
  `detectMetallic()`
- `lib/matcher.ts` - `matchPaints()`, `extractFilterOptions()`,
  `isClearPaint()`

## Next Steps

- [Data Model](03-data-model.md)
- [Overview](01-overview.md)
