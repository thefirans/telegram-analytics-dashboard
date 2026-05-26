# Telegram Chat Analytics Dashboard

Local-only Telegram Desktop chat analytics built with Vite, React, TypeScript, Tailwind CSS, and Apache ECharts.

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm run test
```

## Upload a Telegram export

1. Export a personal chat from Telegram Desktop.
2. Open the app in the browser.
3. Drag `result.json` onto the upload area, or use the file picker.
4. The app parses everything in the browser and renders the dashboard locally.

## Privacy note

- Your file stays in your browser. Nothing is uploaded.
- Raw message text is hidden by default.
- `Allow message snippets` requires an explicit confirmation click.
- `Anonymize` replaces chat and sender names for screenshot-friendly sharing.

## Export options

- Dashboard as PNG
- Dashboard as PDF
- Computed analytics as JSON
- Normalized messages as CSV

## Scripts

```bash
npm run dev
npm run build
npm run test
```
