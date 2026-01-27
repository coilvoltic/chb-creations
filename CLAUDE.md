# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHB Créations is a Next.js 15 e-commerce website for event rentals, personalized accessories, and henna services based in Marseille. The site is in French and uses the App Router architecture with Supabase as the backend database.

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
The app uses four Google Fonts configured in [src/app/layout.tsx](src/app/layout.tsx):
- **Inter**: Primary font (variable: `--font-inter`)
- **Outfit**: Secondary font (variable: `--font-outfit`)
- **Frank Ruhl Libre**: Alternative display font (variable: `--font-frank-ruhl-libre`)
- **Cinzel**: Serif font for decorative titles (variable: `--font-cinzel`)
- Loaded with appropriate weights for each font family

## Database Architecture (Supabase)

### New Hierarchical Structure (Updated 2024)

The database uses a **parent-child hierarchy** to support multiple reservation types (rentals, purchases, services):

```
customer_orders (parent)
├── rental_reservations (child for rentals)
│   └── rental_items (items in rental)
├── purchase_reservations (child for purchases)
│   └── purchase_items (items in purchase)
└── prestation_reservations (child for services like henné)
    └── prestation_items (items in prestation)
```

This structure allows a single customer order to contain multiple types of reservations with separate delivery options for each category.

### Core Tables

1. **customer_orders**: Top-level order grouping multiple sub-reservations
   - `order_number` (bigint): Unique order identifier
   - `customer_infos` (JSONB): `{firstName, lastName, email, phone}`
   - `total_price` (real): Total amount for entire order
   - `created_at`: Order creation timestamp
   - **Purpose**: Groups all reservations from a single customer transaction
   - Can contain multiple `rental_reservations`, `purchase_reservations`, and `prestation_reservations`

2. **rental_reservations**: Sub-reservation for product rentals (locations)
   - `customer_order_id` (FK → customer_orders): Parent order reference
   - `deposit` (real): Required deposit amount (percentage of total)
   - `caution` (real): Security deposit (not charged unless damage)
   - `total_price` (real): Subtotal for this rental reservation
   - `delivery_address` (text, nullable): Delivery address or null for pickup
   - `delivery_fees` (real): Delivery cost
   - `reservation_status`: 'DONE' | 'CANCELLED' | 'CONFIRMED' | 'PENDING'
   - **Note**: No longer contains `customer_infos` (moved to parent)

3. **rental_items**: Individual products in a rental reservation
   - `rental_reservation_id` (FK → rental_reservations): Parent reservation
   - `product_id` (FK → products): Product reference
   - `quantity` (integer): Number of units
   - `rental_start` (timestamp): Start of rental period
   - `rental_end` (timestamp): End of rental period
   - `options` (JSONB): Selected options and installation: `{selectedOptions[], installationFees}`
   - `personalizations` (JSONB): Custom text inputs: `{field_name: value}`
   - `needs_installation` (boolean): Installation service requested

4. **products**: Product catalog
   - Basic info: name, slug, price, new_price (promotional price), images[], description
   - **options**: JSONB array of product option groups
   - **faq**: JSONB array of `{question, answer}` pairs
   - **is_out_of_stock**: Boolean flag to hide products from public access
   - **installation_fees**: Optional per-unit installation service fee
   - Stock management and categorization (category, subcategory, stock)
   - Dynamic unavailabilities computed via SQL function
   - **Note**: Caution and deposit are now calculated globally per order, not per product

5. **purchase_reservations**: Sub-reservation for product purchases (accessoires personnalisés)
   - `customer_order_id` (FK → customer_orders): Parent order reference
   - `total_price` (real): Subtotal for this purchase
   - `reservation_status`: Same status enum as rentals
   - `delivery_address`, `delivery_fees`: Same as rentals

6. **purchase_items**: Individual products in a purchase reservation
   - `purchase_reservation_id` (FK → purchase_reservations): Parent reservation
   - `product_id` (FK → products): Product reference
   - `quantity` (integer): Number of units
   - `estimated_delivery_date` (timestamp, nullable): Expected delivery date
   - `options` (JSONB): Selected options (same structure as rental_items)
   - `personalizations` (JSONB): Custom text inputs

7. **prestation_reservations**: Sub-reservation for services (henné)
   - `customer_order_id` (FK → customer_orders): Parent order reference
   - `total_price` (real): Subtotal for this prestation
   - `reservation_status`: Same status enum as rentals
   - `delivery_address`, `delivery_fees`: For services requiring travel

8. **prestation_items**: Individual services in a prestation reservation
   - `prestation_reservation_id` (FK → prestation_reservations): Parent reservation
   - `product_id` (FK → products): Service reference
   - `quantity` (integer): Number of units (e.g., number of people)
   - `prestation_date` (date, nullable): Service appointment date (date only, no time)
   - `time_slot` (TimeSlot ENUM, nullable): Fixed time slot - 'LUNCH' (12h-15h30), 'AFTERNOON' (16h-20h), 'EVENING' (20h30-23h30)
   - `options` (JSONB): Selected options
   - `personalizations` (JSONB): Custom requirements
   - **Note**: Uses SQL ENUM type for time slots instead of free-form time selection for better scheduling and data integrity

9. **promotional_messages**: Marketing messages for homepage carousel
   - `msg` (text): Message content
   - `created_at`: Timestamp for ordering

### Data Access Patterns
- **Server Actions** ([src/actions/products.ts](src/actions/products.ts)): Use anon key for product fetching
- **API Routes**: Use service_role key to bypass RLS for order/reservation creation
  - [/api/reservations/create](src/app/api/reservations/create/route.ts): Creates `customer_order` → `rental_reservation` → `rental_items`
  - [/api/process-payment](src/app/api/process-payment/route.ts): Same flow after Stripe payment confirmation
- **SQL Functions**:
  - `get_product_unavailabilities(product_id)`: Computes product availability from `rental_items`
  - `update_past_reservations_to_done()`: Auto-updates rental status when rental period ends
- **RLS Policies**: See [src/lib/rls-policies.sql](src/lib/rls-policies.sql)
  - **Security model**: All order creation goes through API routes using service_role key (bypasses RLS safely)
  - `customer_orders`: Only accessible via service_role and authenticated users (admins)
  - `rental_reservations`, `purchase_reservations`, `prestation_reservations`: Same as customer_orders
  - `rental_items`, `purchase_items`, `prestation_items`: Read access for anon (availability checks), write access restricted to service_role
  - `products`: Public read access, service_role write access
  - **Why this is safe**: API routes validate all data before insertion; clients cannot directly insert/update orders

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for client-side queries
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key for server-side operations (⚠️ bypasses RLS)
- `RESEND_API_KEY`: API key for email service
- `GOOGLE_PLACES_API_KEY`: API key for Google Places and Routes API (address autocomplete and delivery calculation)
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for client-side
- `NEXT_PUBLIC_BASE_URL`: Base URL for redirects (e.g., http://localhost:3000)

## Project Structure

### Page Hierarchy & Routing

**Main sections** (3 services):
1. **Locations** (`/services/locations`) - Product rentals
   - Art de table (`/services/locations/art-de-table`)
   - Trônes (`/services/locations/trones`)
   - Déco et accessoires (`/services/locations/deco-et-accessoires`)

2. **Accessoires Personnalisés** (`/services/accessoires-personnalises`) - Custom product purchases
   - Bendir (`/services/accessoires-personnalises/bendir`)
   - Bougies (`/services/accessoires-personnalises/bougies`)
   - Certificats mariage (`/services/accessoires-personnalises/certificats-mariage`)
   - Coussins (`/services/accessoires-personnalises/coussins`)
   - Faire-parts (`/services/accessoires-personnalises/faire-parts`)
   - Oeufs (`/services/accessoires-personnalises/oeufs`)
   - Tableaux (`/services/accessoires-personnalises/tableaux`)
   - Textile (`/services/accessoires-personnalises/textile`)

3. **Henné** (`/services/prestations`) - Henné services
   - Henné seul (`/services/prestations/henne-seul`)
   - Pack henné (`/services/prestations/pack-henne`)

**Individual products** follow pattern: `/services/[category]/[subcategory]/[product-slug]`

**Admin section**:
- `/admin/login`: Admin authentication page
- `/admin/dashboard`: Admin dashboard for managing reservations and viewing analytics
- `/admin/reservations/[id]`: Individual reservation detail page with PDF generation
- Protected routes requiring authentication

### State Management

**CartContext** (`src/contexts/CartContext.tsx`):
- Global shopping cart state using React Context
- Persists to localStorage (key: 'chb-cart')
- Handles cart operations: addToCart, removeFromCart, updateQuantity, clearCart
- **Three separate delivery configurations**: Each category (rentals, purchases, prestations) has independent delivery settings
  - `rentalDelivery`: For location items
  - `purchaseDelivery`: For accessoires personnalisés
  - `prestationDelivery`: For henné services
- Cart item categorization: getRentalItems(), getPurchaseItems(), getPrestationItems()
- Automatically calculates totals including option fees, installation fees, delivery fees, and caution
- Cart items include: product info, quantity, rental period/dates, times, selected options, deposit percentage, caution per unit, personalizations
- Supports delivery modes: 'pickup' (retrait en boutique), 'delivery' (livraison), 'relay_point' (point relais)

### Product Options, Fees & Financial Terms

Products can have optional configurations and financial requirements:
- **Options**: Array of choices (e.g., different color schemes) with additional fees
  - Grouped by `option_type_name` (e.g., "Installation", "Couleur")
  - Default: First option in each group is pre-selected
  - Stored as array in cart items and database (supports multiple option groups)
  - Display: Radio buttons with price adjustments
- **Personalizations**: Custom text inputs for products (e.g., names, dates on custom items)
  - Products have `personalizations` field: array of field labels
  - Customer fills in text fields during add-to-cart
  - Stored as key-value map in cart and database
  - Used mainly for accessoires personnalisés (custom products)
- **Acompte (Deposit)**: Required upfront payment to validate reservation
  - **Calculation**: 50% of total order amount (all categories combined)
  - Includes: product prices + options + installation + delivery fees
  - Paid upfront (online or in-store) to confirm reservation
  - Displayed prominently with blue info styling (info icon)
- **Caution (Security Deposit)**: Security deposit for rental items
  - **Calculation**: 50% of rental items subtotal only (locations category)
  - Applied only to rental items, not purchases or prestations
  - Requested at pickup/delivery (cash, check, or card)
  - **NOT charged/cashed unless damage or loss occurs**
  - Displayed with amber warning styling (warning icon)
- **Installation Services**: Optional installation with per-unit fees
  - Products may have `installation_fees` field
  - Customer can opt-in via checkbox in product detail page
  - Installation flag and fees stored in cart items
- **Delivery Fees**: Category-based base delivery fees + distance-based pricing
  - **Fixed base fees by category**:
    - Locations (rentals): 70€ base
    - Accessoires personnalisés (purchases): 15€ base
    - Henné (prestations): 20€ base
  - **Distance-based fees**: 1€ per kilometer from shop (100 Boulevard de Saint-Loup, 13010 Marseille)
  - **Total delivery cost** = Base fee (category) + (Distance in km × 1€)

### Components

**Core components** in `src/components/`:
- **Navbar.tsx**: Sticky navigation with mega menu dropdown for services
- **Footer.tsx**: Site footer
- **Breadcrumb.tsx**: Navigation breadcrumbs using lucide-react's ChevronRight icon
- **DateRangePicker.tsx**: Rental period selector with unavailability checking and time selection
- **PrestationDatePicker.tsx**: Single date picker for prestation services (henné)
- **TimeSlotPicker.tsx**: Fixed time slot selector for prestations (3 slots: lunch, afternoon, evening)
- **SuccessModal.tsx**: Custom modal for reservation confirmation (replaces browser alerts)
- **GoogleReviews.tsx**: Displays Google Business reviews
- **AddressAutocomplete.tsx**: Google Places autocomplete for delivery addresses
- **ProductDetailPage.tsx**: Reusable product detail component with carousel, options, dates, and add-to-cart
- **ProductListingPage.tsx**: Reusable product grid/list component for category pages
- **Loader.tsx**: Loading spinner component

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
   - Handles both cash and online payment methods
   - Sets reservation_status based on payment method and deposit amount

2. **`/api/process-payment`** (POST):
   - Processes Stripe payments for deposits
   - Creates reservation after successful payment
   - Updates reservation_status to 'CONFIRMED'
   - Sends confirmation email with PDF

3. **`/api/create-checkout-session`** (POST):
   - Creates Stripe Checkout session for deposit payment
   - Returns session URL for redirect

4. **`/api/calculate-delivery`** (POST):
   - Calculates delivery distance and fees using Google Routes API
   - Shop address: 100 Boulevard de Saint-Loup, 13010 Marseille, France
   - Pricing: Fixed base fee (category-dependent: 70€ rentals, 15€ purchases, 20€ prestations) + 1€ per kilometer
   - Returns total delivery fee for the specified category

5. **`/api/autocomplete-address`** (GET):
   - Google Places autocomplete for address suggestions
   - Filters results for France only

6. **`/api/contact`** (POST):
   - Contact form submissions
   - Validates email, name, subject, message

7. **`/api/google-reviews`** (GET):
   - Fetches Google Business reviews via Places API

8. **`/api/admin/reservations`** (GET):
   - Admin API to fetch all reservations with filtering
   - Requires authentication

9. **`/api/admin/reservations/[id]`** (GET, PATCH):
   - Admin API to view and update individual reservations
   - Supports status updates and modifications
   - Requires authentication

10. **`/api/admin/products/create`** (POST):
   - Admin API to create new products
   - Validates all required fields
   - Inserts product into database with all columns
   - Requires authentication

### Admin Product Management

**Product Creation** (`/admin/products/new`):
- Full interface for adding new products with all fields from products table
- **Image Upload Flow**:
  1. User selects images from local filesystem
  2. Images are previewed in the browser
  3. On form submit, images are uploaded to Supabase Storage bucket `chb-creations-products`
  4. Images are organized into subfolders by subcategory (e.g., `art-de-table/`, `deco-et-accessoires/`)
  5. Public URLs are generated for each uploaded image using `getPublicUrl()`
  6. URLs are stored in the `images` column (array of strings) in products table
- **Storage Configuration**:
  - Bucket name: `chb-creations-products` (no spaces)
  - Folder structure: `{subcategory}/{timestamp}-{random}.{ext}` (e.g., `art-de-table/1234567890-abc123.jpg`)
  - Bucket visibility: **Public** (must be set as public bucket in Supabase dashboard)
  - Upload policy: Authenticated users only (via RLS policies)
  - URLs: Public URLs (permanent, no expiry)
- **Form Fields**:
  - Basic: name, slug (auto-generated), price, new_price, category, subcategory, stock
  - Content: description, personalizations (array)
  - Images: Multiple upload with preview and upload status
  - Options: Option groups with multiple options (name, description, additional_fee)
  - FAQ: Question/answer pairs
  - Flags: is_out_of_stock, installation_fees
- **Navigation**: "Nouveau produit" button in admin dashboard header

### Email & PDF System

**Email** (`src/lib/email.tsx`):
- Uses Resend API for sending transactional emails
- Currently in test mode (sends to volticthedev@gmail.com only) - update `to` field in production
- Attaches generated PDF confirmation document
- Includes reservation details with all selected options and personalizations
- Sends for all reservation types: rentals, purchases, and prestations

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
5. **Installation option**: Checkbox for optional installation service (if product has installation_fees)
6. **Deposit warning**: Amber alert box with calculated amount (if deposit required)
7. **Quantity selector**: With stock limit
8. **Date picker**: With unavailability checking and time selection
9. **Add to cart**: Disabled if already in cart or no dates selected

All product pages are client components (`'use client'`) to enable interactivity.

### Checkout & Payment Flow

1. **Cart page** (`/panier`):
   - Display cart items with rental dates and times
   - Delivery option selector: pickup or delivery
   - Address autocomplete for delivery (uses Google Places API)
   - Dynamic delivery fee calculation based on distance
   - Customer information form
   - Payment method selection: cash (pay in-store) or online (Stripe)

2. **Payment processing**:
   - Cash payment: Creates reservation with status 'PENDING', customer pays in-store
   - Online payment: Creates reservation with status 'PENDING', then redirects to Stripe Checkout
   - After successful Stripe payment: Webhook updates reservation status to 'CONFIRMED'

3. **Success page** (`/panier/success`):
   - Displays reservation confirmation
   - Shows reservation number
   - Clears cart

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

Product pages (art-de-table, trônes, deco-et-accessoires, etc.) share identical structure:
- Same component layout and logic
- Only differ in: route params, breadcrumbs, hero images
- When adding new categories, copy existing product page structure
- Server actions in `src/actions/products.ts` follow pattern: `get[Subcategory]Products()`
- All subcategories have corresponding server actions:
  - Locations: `getArtDeTableProducts()`, `getTronesProducts()`, `getDecoEtAccessoiresProducts()`
  - Accessoires: `getBougiesProducts()`, `getCertificatsMariageProducts()`, `getCoussinsProducts()`, `getTableauxProducts()`, `getTextileProducts()`, `getBendirProducts()`, `getFairePartsProducts()`, `getOeufsProducts()`
  - Henné: `getHenneProducts()`, `getPackHenneProducts()`
- Common function: `getProductBySlug(slug)` returns product with unavailabilities attached

## shadcn/ui Integration

Components configured with:
- Base color: neutral
- CSS variables enabled
- RSC (React Server Components) mode
- Prefix: none
- Add components via: `npx shadcn@latest add [component]`
