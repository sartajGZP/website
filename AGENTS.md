# AGENTS.md

Welcome! This file provides essential context, architectural patterns, conventions, and operational instructions for AI agents working in this repository.

---

## 1. Project Overview & Technology Stack

This repository powers the unofficial website for **Right to Recall Party** (https://sartaj.in).

- **Static Site Generator**: [Eleventy (11ty)](https://www.11ty.dev/) (v3.x, ESM config in `eleventy.config.mjs`)
- **Templating**: Nunjucks (`.njk`), Markdown (`.md`), and raw HTML (`.html`)
- **Search Engine**: [Pagefind](https://pagefind.app/) static search (runs on `_site` during build)
- **Styling**: Vanilla CSS modular components in `assets/`, aggregated via `@import` in `assets/bundle.css`
- **JavaScript**: Modular Vanilla JavaScript in `assets/bundle.js` and `assets/toolbar/toolbar.js`
- **Deployment**: GitHub Pages (via `npx eleventy --pathprefix=/website/ && npx pagefind --site _site`)

---

## 2. Directory Structure & Key Concepts

```
├── _data/                   # Global data files (e.g. drafts.json)
├── _includes/               # Reusable templates and layouts
│   ├── components/          # nav-tree.njk, breadcrumb.njk
│   ├── header/              # header.njk, toolbar.njk, lang-switcher.njk, font.njk
│   ├── layouts/             # base.njk, drafts.njk, fb.njk
│   ├── search/              # search.njk
│   └── footer/              # footer.html and footer markdown snippets
├── assets/                  # CSS, JS, and static assets
├── drafts/                  # Legal & policy drafts section
│   ├── en/                  # English drafts (.md, en.json, index.njk)
│   ├── hi/                  # Hindi drafts (.html/.md, hi.json, index.njk)
│   └── index.njk            # Root drafts index listing drafts from _data/drafts.json
├── fb-export/               # Facebook post exports categorized by year/month
├── utils/                   # Helper scripts (e.g. language-helper.js)
├── eleventy.config.mjs      # Eleventy configuration (plugins, filters, collections)
└── package.json             # Project scripts and dependencies
```

---

## 3. Conventions for Nunjucks (`.njk`) & Templates

### Base Layouts
- `layouts/base.njk`: Main site layout with SEO metadata, typography preferences initializers, header, breadcrumbs, content slot, and footer.
- `layouts/drafts.njk`: Specialized layout for individual draft documents with language validation, canonical URLs, and `hreflang` tags for English (`/drafts/en/...`) and Hindi (`/drafts/hi/...`).
- `layouts/fb.njk`: Used for rendering Facebook post records.

### Internationalization (i18n) & Language Helpers
- Supported primary languages: English (`en`) and Hindi (`hi`).
- Every content page under drafts or localized sections should define `lang: "en"` or `lang: "hi"` (frequently handled by directory data files `en.json` and `hi.json`).
- Dynamic language resolution is powered by the `translatedUrl` Nunjucks filter (defined in `utils/language-helper.js`), which checks collections for corresponding language URLs or falls back cleanly up the directory tree.
- Breadcrumbs are constructed via the `generateBreadcrumbs(url, lang)` Nunjucks filter.

### Search Indexing (Pagefind)
- Main article bodies use `<main data-pagefind-body>`.
- Header areas and navigation elements must have `data-pagefind-ignore` to keep search indexes clean.

---

## 4. Working with the `drafts/` Directory

When working on files in or around the `drafts/` folder:
- **Directory Data Files**: `drafts/en/en.json` and `drafts/hi/hi.json` automatically set `lang`, `tags: ["draft"]`, and `layout: "layouts/drafts.njk"` for files in those directories.
- **Data Source**: `_data/drafts.json` contains metadata for all drafts (`id`, `shortName`, `enTitle`, `hiTitle`, `enDesc`, `hiDesc`, `enFb`, `hiFb`, `enDrive`, `hiDrive`).
- **Templates vs. Content**:
  - Do **not** modify or edit the text of the legal/political draft contents unless specifically requested by the user.
  - Template changes (e.g., `drafts/index.njk`, `drafts/en/index.njk`, `drafts/hi/index.njk`, or `_includes/layouts/drafts.njk`) should preserve links to PDF drives, FB links, and bilingual consistency.

---

## 5. CSS & Styling Guidelines

Refer to `CSS_ANALYSIS.md` for in-depth audits. When making CSS edits:
- Keep styles modular within `assets/`.
- Avoid adding aggressive global rules on HTML elements inside `main` (e.g., avoid `main a { display: block; }`). Scope links with explicit component classes.
- Use CSS custom properties (`--font-family`, `--font-size`, `--line-height`) for typography and theme styling.
- Keep table containers wrapped with `.table-wrapper` for mobile scroll responsiveness.

---

## 6. Commands & Verification

- **Build site**:
  ```bash
  npm run build
  ```
- **Build with GitHub Pages prefix + Pagefind search index**:
  ```bash
  npm run build-ghpages
  ```
- **Verification Rule**: Always test changes with `npm run build` to ensure templates compile without Nunjucks/Eleventy syntax errors.
