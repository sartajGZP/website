# Layouts Architecture & Code Quality Analysis (`_includes/layouts/`)

This document provides a detailed technical analysis of the layout templates in `_includes/layouts/`. It outlines design patterns, strengths, weaknesses, duplication, syntax bugs, and recommended improvements.

---

## 1. Overview of Layout Files

The layout directory contains three core Nunjucks (`.njk`) templates:

1. **`base.njk`**: The foundational template used across generic markdown pages, indexes, and sections (blog, elections, etc.).
2. **`drafts.njk`**: The dedicated layout for bilingual legislative and policy draft documents (`/drafts/en/` and `/drafts/hi/`).
3. **`fb.njk`**: The specialized template for individual Facebook post exports (`fb-export/`).

---

## 2. File-by-File Analysis

### 📄 `_includes/layouts/base.njk`
- **Role**: Root shell providing the base HTML envelope, meta tags, user typography script, header, breadcrumbs, content slot, and footer.
- **Strengths**:
  - **Typography FOUC Prevention**: Inline `<script>` immediately reads `user-font-size`, `user-font-family`, and `user-line-height` from `localStorage` and injects them onto the `document.documentElement` root, avoiding flash of unstyled text.
  - **Search Scoping**: Employs `<main data-pagefind-body>` so Pagefind indexes only main body content and ignores headers and footers.
  - **Conditional Navigation**: Safely guards `{% if eleventyNavigation %}` before rendering breadcrumbs.
- **Weaknesses**:
  - Lacks dynamic SEO metadata (`<meta name="description">` or canonical link), which exists in `drafts.njk`.

---

### 📄 `_includes/layouts/drafts.njk`
- **Role**: Layout for legal and policy draft proposals requiring strict bilingual URL alignment and search engine localization.
- **Strengths**:
  - **Strict Validation**: Fails the build early if `lang` frontmatter is missing or contains an invalid value (`None['FATAL ERROR: ...']`).
  - **Bilingual SEO**: Dynamically constructs canonical links and bidirectional `hreflang` tags:
    - `<link rel="alternate" hreflang="hi" href="...">`
    - `<link rel="alternate" hreflang="en" href="...">`
    - `<link rel="alternate" hreflang="x-default" href="...">`
- **Weaknesses / Duplication**:
  - **Complete HTML Boilerplate Duplication**: Re-declares `<!DOCTYPE html>`, `<html>`, `<head>`, Google Analytics, typography `localStorage` script, `<header>`, `<main>`, and `<footer>`, rather than extending `base.njk` using Nunjucks template inheritance (`{% extends "layouts/base.njk" %}`).

---

### 📄 `_includes/layouts/fb.njk`
- **Role**: Presentation template for archival Facebook posts with author metadata, timeline dates, and chronological pagination.
- **Strengths**:
  - **Sequential Navigation**: Uses `getPreviousCollectionItem(page)` and `getNextCollectionItem(page)` from Eleventy's collection API for smooth forward/backward post navigation.
  - **Pagefind Facets**: Exposes hidden faceted search metadata tags (`data-pagefind-filter="author"` and `data-pagefind-filter="group"`).
- **Critical Bugs & Weaknesses**:
  - **HTML Syntax Error**: Line 2 contains a stray closing bracket:
    ```html
    <html lang="{% if lang and lang != 'unknown' %}{{ lang }}{% else %}en{% endif %}">>
    ```
    (Note the trailing `>>`).
  - **Complete Boilerplate Duplication**: Like `drafts.njk`, duplicates the entire HTML document structure, `<head>` tags, and Google Analytics snippet instead of inheriting from `base.njk`.

---

## 3. Comparison Matrix

| Feature | `base.njk` | `drafts.njk` | `fb.njk` |
|---|---|---|---|
| **Inherits `base.njk`** | Root | ❌ (Duplicate HTML shell) | ❌ (Duplicate HTML shell) |
| **Inline Typography Script** | ✅ Yes | ✅ Yes (Identical duplicate) | ✅ Yes (Identical duplicate) |
| **Google Analytics Script** | ✅ Yes | ✅ Yes (Identical duplicate) | ✅ Yes (Identical duplicate) |
| **Canonical Link Support** | ❌ No | ✅ Yes | ❌ No |
| **Meta Description Support** | ❌ No | ✅ Yes | ❌ No |
| **Hreflang Tags** | ❌ No | ✅ Yes (`en` / `hi` / `x-default`) | ❌ No |
| **Pagefind Search Indexing** | ✅ Yes | ✅ Yes | ✅ Yes + Metadata Filters |
| **Next/Prev Post Pagination**| ❌ No | ❌ No | ✅ Yes |
| **HTML Syntax Health** | ✅ Clean | ✅ Clean | ⚠️ Bug: stray `>` on `<html>` tag |

---

## 4. Key Recommendations & Action Items

### 1. Fix the HTML Syntax Error in `fb.njk`
Remove the duplicate `>` on line 2 of `fb.njk`:
```html
<!-- Change: -->
<html lang="{% if lang and lang != 'unknown' %}{{ lang }}{% else %}en{% endif %}">>

<!-- To: -->
<html lang="{% if lang and lang != 'unknown' %}{{ lang }}{% else %}en{% endif %}">
```

### 2. Implement Nunjucks Template Inheritance (`{% extends %}`)
Refactor `base.njk` to define reusable blocks so child layouts do not duplicate boilerplate:
```njk
<!-- In base.njk -->
<head>
  ...
  {% block head %}{% endblock %}
</head>
<body>
  {% include "header/header.njk" %}
  <main data-pagefind-body>
    <div class="page-container content">
      {% block content %}
        {{ content | safe }}
      {% endblock %}
    </div>
  </main>
  {% include "footer/footer.html" %}
</body>
```
Child layouts like `drafts.njk` and `fb.njk` can then simply do:
```njk
{% extends "layouts/base.njk" %}

{% block head %}
  <!-- Layout-specific tags like hreflang or canonical links -->
{% endblock %}

{% block content %}
  <!-- Layout-specific content -->
{% endblock %}
```

### 3. Centralize SEO & Meta Tags in `base.njk`
Elevate `<link rel="canonical">` and `<meta name="description">` checks into `base.njk` so that any markdown page across the entire site benefits from proper SEO metadata when frontmatter provides them.
