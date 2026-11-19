# Eleventy Tools Site

## Requirements
- Node.js 18.11 or newer (Node.js 20 LTS recommended)
- npm

## Install and run
```bash
npm install
npm run serve
```
Open the local URL printed by Eleventy (normally http://localhost:8080).

## Production build
```bash
npm run build
```
The generated static website is written to `_site/`.

## Project structure
```text
.
├── eleventy.config.js
├── package.json
├── src/
│   ├── _data/              # Global JSON data
│   ├── _includes/
│   │   ├── layouts/        # Page layouts
│   │   └── partials/       # Shared UI components
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── posts/              # Markdown blog posts
│   ├── tools/              # Tool pages
│   ├── about.md
│   ├── blog.njk
│   └── index.md
└── _site/                  # Generated output (not committed)
```

## Before deployment
1. Change `site.url` in `src/_data/site.json` to your real production domain.
2. Update the site title, description, author and copyright.
3. Add actual pages for any footer links you introduce.
4. Configure hosting redirects/headers and test the production build.
5. Image compression uses the browser Canvas API. JPEG and WebP quality settings are lossy; PNG export is lossless and ignores the quality slider.
