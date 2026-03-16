# Adding Paints

How to add new paints, brands, or product lines to the database.

## Adding Individual Paints

Edit `data/paints.json` directly and add a new entry:

```json
{
  "brand": "NewBrand",
  "code": "NB-001",
  "name": "Pure Red",
  "hex": "#cc2020",
  "finish": "gloss",
  "type": "lacquer",
  "suitableFor": { "airbrush": true, "handPainting": false }
}
```

No code changes are needed. The app derives brands, finishes, and types from the data at runtime.

## Adding a New Brand from Shopee

The most common workflow for adding a full product line:

1. Open the Shopee product page in your browser
2. Copy the HTML of the color options section
3. Save as a `.html` file in `docs/`
4. Extract to CSV:

    ```bash
    npx tsx scripts/shopee-extract.ts docs/newbrand.html docs/newbrand.csv
    ```

5. Download images:

    ```bash
    mkdir -p public/paints/newbrand_new
    # Download loop using the CSV
    ```

6. Extract hex colors from downloaded images (varies by image layout)
7. Create a scraped JSON file in `scripts/scraped/`
8. Merge into the main database:

    ```bash
    npx tsx scripts/scrape-paints.ts --merge
    ```

9. Backfill `suitableFor` for any entries missing it
10. Validate:

    ```bash
    npx tsx scripts/scrape-paints.ts --validate
    ```

## Adding Paint Images

Place images in `public/paints/{brand-slug}_new/{code}.jpg`.

The `_new` suffix signals that these images need to be compressed before being moved to
the main brand folder. After compressing, move them to `public/paints/{brand-slug}/`.

## Validation

Always run validation after modifying the database:

```bash
npx tsx scripts/scrape-paints.ts --validate
```

This checks for:

- Duplicate entries
- Invalid hex codes
- Missing required fields
- Invalid finish or type values

## Next Steps

- [Data Format](01-data-format.md)
- [Scraper Tools](../02-development/02-scraper-tools.md)
