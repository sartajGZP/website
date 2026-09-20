# Right to Recall Party — Official Website

Unoficial website for the **Right to Recall Party** (https://sartaj.in). Built with [Eleventy (11ty)](https://www.11ty.dev/), Nunjucks, and Vanilla CSS/JavaScript, featuring bilingual English/Hindi content and static search powered by [Pagefind](https://pagefind.app/).

---

## 📌 Features

- **Bilingual Content (English & Hindi)**: Full bilingual draft archives, manifestos, and blog posts with automatic fallback route matching.
- **Drafts Registry**: Legal and policy draft documents cataloged across both English and Hindi versions with metadata powered by `_data/drafts.json`.
- **Search**: Fast, static, client-side search powered by Pagefind.
- **Reading Toolbar**: Custom user typography preferences (font size, font family, line height) stored locally.
- **Hierarchical Navigation**: Native `<details>`/`<summary>` accordion navigation tree.
- **Responsive Breadcrumbs**: Horizontal-scrolling mobile breadcrumb trails.

---

## 🛠️ Tech Stack

- **Static Site Generator**: Eleventy (11ty) v3
- **Templating**: Nunjucks (`.njk`), Markdown (`.md`), HTML
- **Search**: Pagefind
- **Styles**: Modular Vanilla CSS (`assets/bundle.css`)
- **Scripts**: Vanilla JavaScript (`assets/bundle.js`, `assets/toolbar/toolbar.js`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
git clone https://github.com/rrpIndia/ebgdemo.git
cd ebgdemo
npm install
```

### Local Development & Build

- **Build site**:
  ```bash
  npm run build
  ```

- **Build for GitHub Pages with Search Index**:
  ```bash
  npm run build-ghpages
  ```

---

## 📂 Repository Structure

```
├── _data/                   # Global datasets (drafts.json, etc.)
├── _includes/               # Shared templates, layouts, and components
│   ├── components/          # Navigation tree, breadcrumbs
│   ├── header/              # Site header, reading toolbar, language switchers
│   ├── layouts/             # Base, drafts, and facebook layouts
│   ├── search/              # Search widget integration
│   └── footer/              # Footer templates and content
├── assets/                  # CSS styles, JS modules, and static assets
├── blog/                    # Articles and updates
├── drafts/                  # Legal and policy drafts (en/ and hi/)
├── fb-export/               # Facebook post archive
├── manifesto/               # Party manifesto chapters
├── shared-docs/             # Shared documents templates
├── utils/                   # Helper scripts (e.g., language translation routes)
├── eleventy.config.mjs      # Eleventy configuration
├── package.json             # Dependencies and build scripts
├── AGENTS.md                # AI agent instructions and repository conventions
└── CSS_ANALYSIS.md          # Comprehensive CSS audit and design guidelines
```

---

## 🤖 Guidelines for AI Agents & Contributors

Please consult [`AGENTS.md`](./AGENTS.md) for architectural conventions, language routing logic, template expectations, and content preservation rules before modifying files in this repository.
