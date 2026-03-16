# Color Matching

How ModKit Swatch matches a sampled color to the closest hobby paints.

## Pipeline

```text
User clicks image
  -> getImageData(x, y, 1, 1) reads RGBA pixel
  -> rgbToHex(r, g, b) converts to hex string
  -> hexToLab(hex) converts to CIE L*a*b* color space
  -> deltaE(pickedLab, paintLab) computes CIE2000 distance for each paint
  -> Sort by deltaE ascending (lowest = closest match)
  -> Return top 10 results
```

## CIE2000 Delta E

Delta E (CIE2000) measures perceptual color difference. It accounts for how the human eye
perceives color differences across different regions of the color space. Lower values mean
colors are more similar.

| Delta E Range | Perception |
| ------------- | -------------------------------------------------- |
| < 2 | Nearly identical to the eye |
| 2 to 5 | Good match, slight difference visible side-by-side |
| 5 to 10 | Fair match, noticeable difference |
| > 10 | Rough match, clearly different |

The app uses `chroma.deltaE()` from the `chroma-js` library, which implements CIE2000.

## Lab Precomputation

On app load, all paints in the database are mapped once to attach precomputed L\*a\*b\* values:

```typescript
const paints = paintsData.map((p) => ({
  ...p,
  lab: hexToLab(p.hex),
}));
```

This runs once per page load, not per click. Matching is synchronous and completes within milliseconds.

## Filtering

Filters are applied before scoring. The matcher filters paints by brand, finish, and type,
then scores only the remaining paints. The `excludeClear` toggle uses the
`finish === "clear"` field to hide transparent paints from results.

## Key Files

- `lib/colorMath.ts` - `hexToLab()`, `deltaE()`, `rgbToHex()`, `getContrastColor()`
- `lib/matcher.ts` - `matchPaints()`, `extractFilterOptions()`, `isClearPaint()`

## Next Steps

- [Data Model](03-data-model.md)
- [Overview](01-overview.md)
