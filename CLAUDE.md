# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHB Créations is a Next.js 15 e-commerce website for event decoration services, personalized accessories, henna services, and event rentals based in Marseille. The site is in French and uses the App Router architecture.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

The development server runs on http://localhost:3000

## Architecture

### Framework & Stack
- **Next.js 15.5.2** with App Router (src/app directory)
- **React 19.1.0** with Server Components by default
- **TypeScript** with strict mode enabled
- **Tailwind CSS 4** with @tailwindcss/postcss for styling
- **Turbopack** for both dev and build (enabled via --turbopack flag)

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)
- Use this consistently for all imports: `@/components/...`, `@/app/...`

### Fonts
The app uses two Google Fonts configured in [src/app/layout.tsx](src/app/layout.tsx:6-16):
- **Inter**: Primary font (variable: `--font-inter`)
- **Outfit**: Secondary font (variable: `--font-outfit`)
- Both loaded with weights 300-800

## Project Structure

### Page Hierarchy & Routing

The app follows a hierarchical breadcrumb structure with dynamic nested routes:

**Main sections** (4 services):
1. **Locations** (`/services/locations`)
   - Art de table (`/services/locations/art-de-table`)
   - Trônes (`/services/locations/trones`)
   - Tenues homme (`/services/locations/tenues-homme`)
   - Déco et accessoires (`/services/locations/deco-et-accessoires`)

2. **Accessoires** (`/services/accessoires`)

3. **Henné** (`/services/henne`)

4. **Décoration** (`/services/decoration`)

**Individual products** follow pattern: `/services/locations/[category]/[product-slug]`
Example: `/services/locations/art-de-table/lot-2-assiettes-lisere-dore`

### Data Management

Product data is stored in JSON files in `public/imgs/[category]/`. Example:
- `/public/imgs/location/art-de-table/artDeTable.json` contains product listings with name, price, and image path
- Product pages import and use this data directly in page components
- Images follow the same directory structure: `/public/imgs/location/art-de-table/articles/[product-image].png`

### Components

**Core components** in `src/components/`:
- **Navbar.tsx**: Sticky navigation with transparent-on-scroll behavior for homepage, mega menu dropdown for services
- **Footer.tsx**: Site footer
- **Breadcrumb.tsx**: Navigation breadcrumbs using lucide-react's ChevronRight icon

**UI components** in `src/components/ui/`:
- Uses shadcn/ui convention (configured via components.json)
- navigation-menu.tsx from Radix UI

### Styling Patterns

The site uses a luxury/elegant design inspired by hotelmahfouf.com:
- Custom shadows: `shadow-soft`, `shadow-dark`
- Rounded corners: `rounded-3xl` for cards
- Gradients: `bg-gradient-to-t from-black/60 to-transparent` on images
- Hover effects: `group-hover:scale-110` for images, smooth transitions
- Animation classes: `animate-fade-in-up`, `animate-scale-in` with delays

### API Routes

**Contact form**: `/api/contact/route.ts`
- POST endpoint for contact form submissions
- Validates email, name, subject, message
- Currently logs to console (TODO: integrate email service like SendGrid/Resend)
- Target email in comments: `chaymaeb.creations@gmail.com`

## Design Requirements

Following `Informations.md` specifications:
- Navigation structure: Accueil, Nos services (dropdown), Contact
- Services dropdown with 4 cards showing main images and descriptions
- Breadcrumb navigation for all sub-pages
- Hero sections with overlay gradients
- Product grids with hover effects
- French language throughout
- SVG icons from inline SVG or lucide-react

## Key Conventions

1. **Server vs Client Components**: Default to Server Components unless interactivity required (use `'use client'` directive sparingly)
2. **Image paths**: All images in `/public/imgs/` with organized subdirectories
3. **Responsive**: Mobile-first with md: and lg: breakpoints
4. **French content**: All text, metadata, and user-facing strings in French
5. **Pricing**: Display as `{price.toFixed(2)} €` for consistency
6. **Links**: Use Next.js `<Link>` component with proper href paths
7. **Metadata**: Set page title and description in layout.tsx or page metadata exports

## shadcn/ui Integration

Components configured with:
- Base color: neutral
- CSS variables enabled
- RSC (React Server Components) mode
- Prefix: none
- Add components via: `npx shadcn@latest add [component]`
