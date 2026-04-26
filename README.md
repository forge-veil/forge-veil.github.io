# vatsal-bakshi.github.io

Personal site for [Vatsal Bakshi](https://vatsal-bakshi.github.io). Built with Astro 6.

## Stack

- **Framework** — Astro 6 with MDX
- **3D** — Three.js (Klein bottle, Gabriel's Horn, Bloch sphere, golf flight visualization)
- **Math** — KaTeX via rehype-katex
- **Syntax highlighting** — Shiki
- **Styles** — Tailwind CSS + hand-written global CSS
- **Deploy** — GitHub Pages via GitHub Actions

## Structure

```
src/
├── components/       # Astro components (3D renders, UI, layout)
├── content/
│   └── posts/        # MDX blog posts
├── layouts/          # BaseLayout
├── pages/            # index, blog, resume
└── styles/
    └── global.css
public/               # Static assets (icons, favicons)
.github/workflows/    # GitHub Pages deploy workflow
```

## Development

```sh
npm install
npm run dev       # localhost:4321
npm run build
npm run preview
```

## Deploy

Pushes to `main` trigger the GitHub Actions workflow and deploy to GitHub Pages automatically.
