# Visual Improvement Plan

Status: **Phase 1 implemented** — Phases 2–5 proposed.
Scope: visual design, layout, styling, and presentation only. Legal/political draft text is out of scope.

---

## 1. Goals

1. Make the site look intentional and trustworthy rather than "default browser + scattered overrides."
2. Establish one design system (color, type, spacing, radius, elevation, motion) used by every component.
3. Improve readability and navigation on mobile, where most political content is read.
4. Raise accessibility to WCAG AA (focus visibility, contrast, tap targets, reduced motion).
5. Keep the work incremental and low-risk: one visual layer per PR, verified with `npm run build`.

### Non-goals

- Rewriting legal draft content or changing draft metadata.
- Migrating content out of `fb-export/` or changing Pagefind indexing behavior.
- Adding a frontend framework or CSS build step.
- Redesigning the URL structure.

---

## 2. Current-State Audit

Evidence from the existing codebase:

| Area | Problem | Location |
|---|---|---|
| Color | Three competing link colors: purple `#6200ea`, green in `main`, and blue `#034ad8`. | `assets/bundle.css:138`, `:149`, `assets/breadcrumb.css:35` |
| Global leak | `main a { color: green; display: block; margin-bottom: 2vh; }` breaks inline prose links and forces `!important` overrides. | `assets/bundle.css:149` |
| Tokens | Only font metrics are tokenized; colors, spacing, radii, and shadows are hard-coded per file. | `assets/bundle.css:11` |
| Typography | No heading scale, no prose rhythm, no `blockquote`/`code`/`hr` styling. | `assets/bundle.css` |
| Header | Four stacked full-width rows (brand, search, toolbar, nav tree); very tall on mobile. | `_includes/header/header.njk` |
| Search | Filter pane, input, summary, and up to 50 results render in the header on every page. | `_includes/search/search.njk` |
| Footer | Flat grey `#bebcbf`, 100px top gap, empty `disclaimer` grid area, only four links. | `assets/bundle.css:158`, `_includes/footer/footer.html` |
| Tables | `width: 145%` forces horizontal scrolling even on desktop. | `assets/table.css:9` |
| Accessibility | Nav-tree removes all focus outlines; 0.25rem controls are below tap-target guidance. | `assets/nav-tree.css:87`, `assets/toolbar/toolbar.css:80` |
| Identity | The "logo" is centered text; no logo, favicon, or OG image is configured. | `_includes/header/header.njk:5`, `_includes/layouts/base.njk` |
| Listings | Draft/FB/blog indexes are plain link lists with no card hierarchy or imagery. | `index.md`, `drafts/index.njk`, FB indexes |
| Hindi type | Only Kalam is self-hosted; Noto Devanagari fallbacks may render inconsistently across devices. | `_includes/header/typography-init.njk`, `assets/fonts/` |

---

## 3. Guiding Principles

- New CSS uses BEM (`block__element--modifier`); legacy classes get a deprecated alias with `/* TODO(BEM): remove legacy */`.
- No new `!important`. Fix the global rule causing the conflict instead.
- Mobile-first; test at 320px, 360px, 768px, and 1280px.
- Reuse existing components (`fb-post`, `docs-nav`, `reading-toolbar`) instead of creating parallel systems.
- One component/layer per branch and PR; run `npm run build` after every change.
- Do not edit `_site/` and do not edit draft content.

---

## 4. Phased Plan

### Phase 0 — Baseline and guardrails

- [ ] Capture baseline screenshots (home, draft article, FB post, Hindi page) at 360/768/1280.
- [ ] Record current Lighthouse scores (Performance, Accessibility, Best Practices, SEO).
- [ ] Add this plan to `.eleventyignore` so it is not published.
- [ ] Confirm build is green before starting: `npm run build`.

**Exit criteria:** baseline captured and build passes.

---

### Phase 1 — Design tokens, typography, and link cleanup

Highest impact, lowest risk. Do this first.

- [x] Extend `:root` in `assets/bundle.css` with:
  - color: `--color-primary`, `--color-primary-strong`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-surface`, `--color-surface-alt`, `--color-bg`
  - space: `--space-1` … `--space-8`
  - radius: `--radius-sm`, `--radius-md`, `--radius-lg`
  - elevation: `--shadow-sm`, `--shadow-md`
  - type scale: `--text-xs` … `--text-xl`, plus prose heading sizes `--text-h1` … `--text-h4`
- [x] Replace hard-coded blues in `breadcrumb.css`, `toolbar.css`, `fb.css`, and `bundle.css` with tokens.
- [x] Remove `main a { color: green; display: block; margin-bottom: 2vh; }`.
- [x] Introduce a `.prose` wrapper (or scope to `.content`) for article styling:
  - readable measure (`65–75ch`), generous line-height
  - inline links underlined with hover/focus color
  - heading margins and scale
  - `ul`/`ol`, `blockquote`, `hr`, `code`, `img`, `figure`, `figcaption`
- [x] Remove the `!important` overrides in `assets/nav-tree.css` that only exist because of `main a`.
- [x] Fix `assets/table.css`: `width: 100%; min-width: 600px;` and add `.table-wrapper` margin/rounding.
- [x] Normalize focus styles: `:focus-visible` outline token applied to links, buttons, summaries, and selects.

**Files:** `assets/bundle.css`, `assets/breadcrumb.css`, `assets/nav-tree.css`, `assets/fb.css`, `assets/table.css`, `assets/toolbar/toolbar.css`.

**Exit criteria:**
- No green/purple links remain.
- Inline prose links stay inline.
- Tables do not overflow at desktop widths.
- `npm run build` passes.

#### Palette decision: High-Contrast White

Chosen for maximum clarity on legal/policy drafts. Pure black is avoided to reduce halation; one accent is used for links, focus, and active states only.

| Token | Value | Contrast |
|---|---|---|
| `--color-bg` | `#ffffff` | — |
| `--color-surface` | `#ffffff` | — |
| `--color-surface-alt` | `#f5f5f5` | — |
| `--color-heading` | `#111111` | 18.9:1 on white |
| `--color-text` | `#1a1a1a` | 17.4:1 on white |
| `--color-text-muted` | `#555555` | 7.5:1 on white |
| `--color-primary` | `#0b4f8a` | 8.4:1 on white |
| `--color-primary-strong` | `#063a66` | hover |
| `--color-primary-soft` | `#e8f1f8` | selection |
| `--color-border` | `#e5e5e5` | — |
| `--color-border-strong` | `#d4d4d4` | — |

Scannability rules: near-black headings, muted metadata, underlined links, and no blue headings. White-on-white separation relies on borders and gray surfaces.

---

### Phase 2 — Header, navigation, search, and footer shell

- [ ] Restructure header to a compact top row:
  - brand on the left (smaller `clamp()` range), primary nav on the right
  - sticky header with subtle shadow on scroll (CSS-only where possible)
- [ ] Reduce the brand size from `clamp(28px, 11vw, 48px)` to a sane responsive range; keep the two-line bilingual name.
- [ ] Move the reading toolbar into a collapsible "Reading options" panel (`<details>` or popover):
  - keep language switcher visible outside the panel
  - preserve existing IDs and `localStorage` keys used by `toolbar.js`
- [ ] Collapse the inline `nav-tree` on mobile into an off-canvas or `<details>` menu; keep it expanded on desktop if desired.
- [ ] Search:
  - keep a compact search input in the header
  - move `pagefind-filter-pane`, `pagefind-summary`, and `pagefind-results` to a dedicated `/search/` page (or an accessible modal)
  - style Pagefind results to match the card system
- [ ] Rebuild the footer:
  - dark/branded surface with columns for site, drafts, contact, socials
  - restore disclaimer text in the existing `disclaimer` grid area
  - add language links (English / हिन्दी)
  - remove the 100px `margin-top` gap
- [ ] Standardize breadcrumb spacing and truncate long trails on mobile.

**Files:** `_includes/header/header.njk`, `_includes/header/toolbar.njk`, `_includes/components/nav-tree.njk`, `_includes/search/search.njk`, `_includes/footer/footer.html`, `assets/bundle.css`, `assets/search.css`, `assets/toolbar/toolbar.css`, `assets/nav-tree.css`.

**Exit criteria:**
- Header fits in ≤ 2 rows on desktop and ≤ 3 on mobile.
- Search results no longer occupy the header.
- Footer contains disclaimer and language links.
- Reading preferences still persist across reloads.

---

### Phase 3 — Landing pages and content cards

- [ ] Home page hero: logo/brand mark, one-sentence mission, primary CTA ("Read the drafts") and secondary CTA ("Contact").
- [ ] Add a reusable `.card` component:
  - surface, border, radius, shadow, hover elevation
  - title, description, meta row, optional thumbnail
  - used for drafts, FB archive, blog, and search results
- [ ] Convert draft and FB index listings to a responsive card grid (1 / 2 / 3 columns).
- [ ] Add image handling: `loading="lazy"`, `decoding="async"`, fixed aspect ratio, `object-fit: cover`.
- [ ] Define empty states for categories with no entries.
- [ ] Use the existing unused images in `assets/img/` or add licensed imagery; do not ship large uncompressed photos.

**Files:** `index.md`, `drafts/index.njk`, `drafts/en/index.njk`, `drafts/hi/index.njk`, FB index templates, new `assets/card.css`, `assets/bundle.css`.

**Exit criteria:**
- Home page has a clear visual hierarchy and CTA.
- Listings are scannable at 360px without horizontal scroll.
- Images are lazy-loaded and do not cause layout shift.

---

### Phase 4 — Theme, identity, and accessibility polish

- [ ] Add dark mode:
  - token overrides under `@media (prefers-color-scheme: dark)`
  - optional manual toggle persisted in `localStorage`
  - ensure images and Pagefind UI remain legible
- [ ] Add brand assets:
  - `favicon.svg` + fallback
  - `apple-touch-icon`
  - default OG/Twitter preview image in `base.njk`
  - logo mark in the header (text remains the fallback)
- [ ] Self-host or preload the Devanagari font used by the Hindi toolbar option; verify Hindi rendering on Android.
- [ ] Accessibility sweep:
  - minimum 44×44 tap targets for toolbar controls
  - `:focus-visible` everywhere; remove outline suppression
  - AA contrast for footer, muted text, and disabled language labels
  - `prefers-reduced-motion` disables transforms/transitions
  - semantic landmarks and skip link to `main`
- [ ] Print styles for drafts (hide toolbar/nav/footer, expand links).

**Files:** `assets/bundle.css`, `assets/toolbar/toolbar.css`, `assets/nav-tree.css`, `assets/fonts/`, `_includes/layouts/base.njk`, `_includes/header/header.njk`, `_includes/header/typography-init.njk`, `assets/img/`.

**Exit criteria:**
- Lighthouse Accessibility ≥ 95.
- Dark mode has no unreadable text.
- Keyboard navigation shows a visible focus ring.
- Hindi and English pages render consistently.

---

### Phase 5 — Verification and rollout

- [ ] `npm run build` passes with no Nunjucks errors.
- [ ] `npm run build-ghpages` succeeds (Pagefind index still builds).
- [ ] Re-shoot screenshots at all four breakpoints and compare with baseline.
- [ ] Verify both languages (`/` and `/hi/`) and both layouts (`drafts`, `fb`).
- [ ] Check Pagefind search, language switch, and typography persistence.
- [ ] Confirm no horizontal overflow at 320px on home, article, table, and footer.
- [ ] Update `CSS_ANALYSIS.md` and `AGENTS.md` if tokens or conventions change.

---

## 5. Prioritized Backlog

| Priority | Item | Impact | Effort | Phase |
|---|---|---|---|---|
| P0 | Fix `main a` global + link colors | High | S | 1 |
| P0 | Design tokens in `:root` | High | S | 1 |
| P0 | Table width fix | Medium | XS | 1 |
| P1 | Prose/heading typography | High | M | 1 |
| P1 | Compact header + toolbar panel | High | M | 2 |
| P1 | Search results moved out of header | High | M | 2 |
| P1 | Footer rebuild + disclaimer | Medium | S | 2 |
| P1 | Focus-visible + tap targets | High | S | 4 |
| P2 | Card grid for listings | High | M | 3 |
| P2 | Home hero + identity assets | High | M | 3 |
| P2 | Dark mode | Medium | M | 4 |
| P3 | Print styles, Devanagari font polish | Low | S | 4 |

Effort: XS < 1h, S = 1–3h, M = half day.

---

## 6. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `main a` removal changes existing pages unexpectedly | Apply `.prose` styling in the same PR; spot-check home, drafts, FB, contact, and Hindi pages. |
| Header refactor breaks `toolbar.js` selectors | Keep all existing IDs/classes until JS is updated; test font size, weight, spacing, and language switch. |
| Nav-tree behavior regresses on mobile | Keep `<details>` semantics and test keyboard/touch; do not remove `eleventyNavigation`. |
| Pagefind result styling breaks on version update | Scope overrides under a dedicated class/page; avoid global `pagefind-*` rules where possible. |
| Dark mode increases scope | Ship token-based dark mode only; no per-component redesign in the same PR. |
| Visual churn delays content updates | Phases are independently shippable; stop after any phase and still get value. |

---

## 7. Definition of Done

- One token source of truth; no hard-coded brand colors in component files.
- No new `!important`; legacy overrides removed where safe.
- No horizontal page scroll at 320px.
- Visible keyboard focus on every interactive element.
- AA contrast for body text, muted text, footer, and controls.
- Reading toolbar remains functional and persistent in both languages.
- `npm run build` and `npm run build-ghpages` pass.
- Draft content untouched.

---

## 8. Open Questions

1. Is there an official party logo file, or should the brand stay text-only?
2. Should the primary brand color remain blue (`#034ad8`) or move to a party-specific palette?
3. Is dark mode a requirement or a nice-to-have?
4. Should search live on `/search/` or in a modal?
5. Keep the full nav-tree in the header, or replace it with a compact primary nav + section index?
6. Are the unused `assets/img/` photos approved for publication?
