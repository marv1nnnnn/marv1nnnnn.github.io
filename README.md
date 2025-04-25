
![MacOS Terminal Portfolio](https://storage.googleapis.com/v-staff/theme-cover.png)

Personal portfolio showcasing software engineering, indie game development, and digital art projects, presented with an interactive macOS-inspired interface. This project uses a customized version of the [MacOS Terminal Portfolio Astro Theme](https://github.com/JohnnyCulbreth/macos-terminal-portfolio).

## Features

- Interactive macOS-style terminal interface
- Dynamic rotating wallpapers
- Responsive macOS-style dock
- Built-in SEO optimization
- Automated sitemap generation
- Tailwind CSS styling
- Mobile-friendly design

## Tech Stack

- [Astro](https://astro.build)
- [React](https://reactjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

## Integrations

- @astrojs/react
- @astrojs/vercel
- @astrolib/seo
- @astrojs/sitemap

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)

### Local Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```
    This will start the local development server, typically at `http://localhost:4321`.

### Building for Production

To create a production build:

```bash
npm run build
```
This command bundles the site into the `dist/` directory (or as configured for the deployment adapter).

## Customization Notes

While the core theme has been adapted for this portfolio, further customizations can be made:

-   **Personal Information & Content:** Modify React components in `src/components/global/` (e.g., `MacTerminal.tsx`, `DesktopDock.tsx`, `MobileDock.tsx`) and Astro pages in `src/pages/` to update content, links, and behavior.
-   **SEO Metadata:** Update meta tags in `src/components/global/BaseHead.astro` and potentially individual pages like `src/pages/index.astro`.
-   **Background Images:** Replace or add images in the `src/assets/images/` directory.
-   **Styling:** Adjust styles using Tailwind CSS utility classes or by modifying `src/styles/global.css`.

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com/) using the `@astrojs/vercel` adapter (see `astro.config.mjs`).

## Original Theme Acknowledgments

- Inspired by macOS interface
- Original theme by Johnny Culbreth
- Built with Astro
