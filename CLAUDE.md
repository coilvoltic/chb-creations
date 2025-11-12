# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHB Créations is a Next.js 15 e-commerce website for event decoration services, personalized accessories, henna services, and event rentals based in Marseille. The site is in French and uses the App Router architecture with Supabase as the backend database.

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
- **Supabase** for database, authentication, and backend services
- **Resend** for transactional emails with PDF attachments
- **@react-pdf/renderer** for generating reservation confirmation PDFs

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)
- Use this consistently for all imports: `@/components/...`, `@/app/...`, `@/lib/...`

### Fonts
The app uses three Google Fonts configured in [src/app/layout.tsx](src/app/layout.tsx):
- **Inter**: Primary font (variable: `--font-inter`)
- **Outfit**: Secondary font (variable: `--font-outfit`)
- **Satisfy**: Display font for titles (variable: `--font-satisfy`)
- All loaded with weights 300-800

## Database Architecture (Supabase)

### Core Tables
1. **products**: Product catalog with:
   - Basic info: name, slug, price, images[], description, features[]
   - **options**: JSONB array of product options with `{name, description, additional_fee}`
   - **deposit**: Integer percentage (0-100) for required deposit
   - **faq**: JSONB array of `{question, answer}` pairs
   - Stock management and categorization (category, subcategory)

2. **reservations**: Customer reservations with:
   - customer_infos (JSONB): firstName, lastName, email, phone
   - deposit, caution, total_price
   - reservation_status: 'DONE' | 'CANCELLED' | 'CONFIRMED' | 'CONFIRMED_NO_DEPOSIT'

3. **reservation_items**: Individual items in a reservation:
   - Links to product_id and reservation_id
   - rental_start, rental_end (ISO timestamps)
   - quantity
   - **options**: JSONB storing selected option for this item

### Data Access Patterns
- **Server Actions** (`src/actions/products.ts`): Use anon key for product fetching
- **API Routes** (`src/app/api/reservations/create/route.ts`): Use service_role key to bypass RLS for reservation creation
- **SQL Functions**: `get_product_unavailabilities(product_id)` dynamically computes product availability from reservation_items

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for client-side queries
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key for server-side operations (⚠️ bypasses RLS)
- `RESEND_API_KEY`: API key for email service

## Project Structure

### Page Hierarchy & Routing

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

### State Management

**CartContext** (`src/contexts/CartContext.tsx`):
- Global shopping cart state using React Context
- Persists to localStorage
- Handles cart operations: addToCart, removeFromCart, updateQuantity, clearCart
- Automatically calculates totals including option fees
- Cart items include: product info, quantity, rental period, times, selected option, deposit percentage

### Product Options & Deposits

Products can have optional features:
- **Options**: Array of choices (e.g., different color schemes) with additional fees
  - Default: First option is pre-selected
  - Stored in cart and reservation_items
  - Display: Radio buttons with price adjustments
- **Deposits**: Required percentage of total price to validate reservation
  - Only shown if deposit > 0
  - Calculated per-item based on quantity and selected option
  - Displayed prominently with amber warning styling

### Components

**Core components** in `src/components/`:
- **Navbar.tsx**: Sticky navigation with mega menu dropdown for services
- **Footer.tsx**: Site footer
- **Breadcrumb.tsx**: Navigation breadcrumbs using lucide-react's ChevronRight icon
- **DateRangePicker.tsx**: Rental period selector with unavailability checking and time selection
- **SuccessModal.tsx**: Custom modal for reservation confirmation (replaces browser alerts)
- **GoogleReviews.tsx**: Displays Google Business reviews

**UI components** in `src/components/ui/`:
- Uses shadcn/ui convention (configured via components.json)
- navigation-menu.tsx from Radix UI

### API Routes

1. **`/api/reservations/create`** (POST):
   - Creates reservation and reservation_items
   - Includes selected options in database
   - Sends confirmation email with PDF attachment
   - Uses service_role key to bypass RLS
   - Includes rollback on item creation failure

2. **`/api/contact`** (POST):
   - Contact form submissions
   - Validates email, name, subject, message

3. **`/api/google-reviews`** (GET):
   - Fetches Google Business reviews via Places API

### Email & PDF System

**Email** (`src/lib/email.tsx`):
- Uses Resend API for sending
- Currently in test mode (sends to volticthedev@gmail.com only)
- Attaches generated PDF
- Includes reservation details and selected options

**PDF Generator** (`src/lib/pdf-generator.tsx`):
- Uses @react-pdf/renderer
- Generates confirmation documents with:
  - Company branding (text-based, not images)
  - Reservation number and customer info
  - Itemized table with options displayed
  - Total amount
- Limitations: Cannot use local image files, must use base64 or text

### Styling Patterns

The site uses a luxury/elegant design:
- Custom shadows: `shadow-soft`, `shadow-dark`
- Rounded corners: `rounded-3xl` for cards
- Gradients: `bg-gradient-to-b from-black/40 via-black/60 to-black/85` on hero images
- Hover effects: `group-hover:scale-105` for images with `transition-transform duration-500`
- Animation classes: `animate-fade-in-up`, `animate-scale-in` with inline style delays
- Amber color scheme for warnings (deposits, options)

### Product Page Architecture

Product detail pages (`[slug]/page.tsx`) follow a consistent structure:
1. **Image carousel** with navigation arrows and dot indicators
2. **Price display** with option fee breakdown if applicable
3. **Tabs system**: Description / FAQ (if FAQ exists)
4. **Options selector**: Radio buttons in bordered cards (if options exist)
5. **Deposit warning**: Amber alert box with calculated amount (if deposit required)
6. **Quantity selector**: With stock limit
7. **Date picker**: With unavailability checking
8. **Add to cart**: Disabled if already in cart or no dates selected

All product pages are client components (`'use client'`) to enable interactivity.

## Key Conventions

1. **Server vs Client Components**: Default to Server Components unless interactivity required (use `'use client'` directive sparingly)
2. **Image paths**: All images in `/public/imgs/` with organized subdirectories
3. **Responsive**: Mobile-first with md: and lg: breakpoints
4. **French content**: All text, metadata, and user-facing strings in French
5. **Pricing**: Display as `{price.toFixed(2)} €` for consistency
6. **Links**: Use Next.js `<Link>` component with proper href paths
7. **Metadata**: Set page title and description in layout.tsx or page metadata exports
8. **Error handling**: Log errors but don't fail reservations if email sending fails
9. **TypeScript**: Use interfaces from `@/lib/supabase` and `@/lib/cart-types` for type safety

## Code Factorization

Product pages (art-de-table, trônes, etc.) share identical structure:
- Same component layout and logic
- Only differ in: route params, breadcrumbs, hero images
- When adding new categories, copy existing product page structure
- Server actions in `src/actions/products.ts` follow pattern: `get[Category]Products()`

## shadcn/ui Integration

Components configured with:
- Base color: neutral
- CSS variables enabled
- RSC (React Server Components) mode
- Prefix: none
- Add components via: `npx shadcn@latest add [component]`
