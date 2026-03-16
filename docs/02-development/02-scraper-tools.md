# Scraper Tools

The `scripts/` directory contains standalone tools for building and maintaining the paint
database. These are separate from the main app and are excluded from git.

## Shopee HTML Extractor

Extracts paint names and image URLs from a saved Shopee product page.

```bash
npx tsx scripts/shopee-extract.ts <input.html> [output.csv]
```

### Workflow

1. Open a Shopee product page in your browser
2. Right-click the color options section, copy the outer HTML
3. Save as an `.html` file
4. Run the extractor to get a CSV

The extractor parses `button[aria-label]` elements for paint names and `img.src` for image URLs.

## Paint Scraper

Scrapes paint data from web sources and manages the paint database.

```bash
npx tsx scripts/scrape-paints.ts                      # scrape all sources
npx tsx scripts/scrape-paints.ts --source=gaianotes   # scrape one source
npx tsx scripts/scrape-paints.ts --validate           # validate existing data
npx tsx scripts/scrape-paints.ts --merge              # merge scraped into paints.json
npx tsx scripts/scrape-paints.ts --import-csv file.csv # import from CSV
```

### Validation

The `--validate` flag checks all paints for:

- Duplicate brand+code combinations
- Invalid hex values
- Missing required fields
- Invalid finish or type values
- Suspicious placeholder hex values (#000000 for non-black paints)

## Image Downloader

Downloads paint product images from known sources.

```bash
npx tsx scripts/download-images.ts                     # download all
npx tsx scripts/download-images.ts --brand=tamiya      # download one brand
npx tsx scripts/download-images.ts --dry-run           # preview without downloading
```

Images are saved to `public/paints/{brand-slug}/{code}.jpg`.

> **Note**: New paint images should go in `public/paints/{brand-slug}_new/` so they can be
> compressed before being moved to the main folder.

## Next Steps

- [Paint Database Format](../03-paint-database/01-data-format.md)
- [Adding New Paints](../03-paint-database/02-adding-paints.md)
