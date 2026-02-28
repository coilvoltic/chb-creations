/**
 * Application constants and configuration
 * Centralized configuration for all hardcoded values
 */

// ==================== SHOP CONFIGURATION ====================

export const SHOP_CONFIG = {
  name: 'CHB Créations',
  address: '100 Boulevard de Saint-Loup, 13010 Marseille, France',
  phone: '+33 6 XX XX XX XX', // TODO: Update with actual phone
  email: 'contact@chb-creations.fr',

  // Business hours (if needed)
  hours: {
    weekday: '9h-18h',
    weekend: '10h-17h',
  },
} as const

// ==================== DELIVERY CONFIGURATION ====================

export const DELIVERY_CONFIG = {
  // Fixed base delivery fees by category (in euros)
  baseFees: {
    locations: 70, // Rentals
    'accessoires-personnalises': 15, // Purchases (unused - replaced by fixedFees)
    prestations: 0, // Prestations (henné services)
  },

  // Fixed flat delivery fees (no distance calculation)
  fixedFees: {
    'accessoires-personnalises': 19.99, // Flat rate for purchases
  },

  // Distance-based pricing
  costPerKm: 1, // 1€ per kilometer

  // Free delivery threshold (if applicable in the future)
  freeDeliveryThreshold: null, // Set to number (e.g., 500) to enable
} as const

// ==================== FINANCIAL CONFIGURATION ====================

export const FINANCIAL_CONFIG = {
  // Deposit (acompte) - percentage of total order amount
  depositPercentage: 0.5, // 50% of total order

  // Security deposit (caution) - percentage of rental items subtotal
  cautionPercentage: 0.5, // 50% of rental items only

  // Caution payment methods
  cautionPaymentMethods: ['cash', 'check', 'card'] as const,

  // Currency
  currency: 'EUR',
  currencySymbol: '€',
} as const

// ==================== RESERVATION CONFIGURATION ====================

export const RESERVATION_CONFIG = {
  // Reservation statuses
  statuses: {
    PENDING: 'PENDING' as const,
    CONFIRMED: 'CONFIRMED' as const,
    DONE: 'DONE' as const,
    CANCELLED: 'CANCELLED' as const,
  },

  // Payment methods
  paymentMethods: {
    ONLINE: 'online' as const,
    CASH: 'cash' as const,
  },

  // Reservation number format
  orderNumberPrefix: 'CHB',
} as const

// ==================== PRODUCT CATEGORIES ====================

export const CATEGORIES = {
  LOCATIONS: 'locations',
  ACCESSOIRES_PERSONNALISES: 'accessoires-personnalises',
  PRESTATIONS: 'prestations',
} as const

export const SUBCATEGORIES = {
  // Locations
  ART_DE_TABLE: 'art-de-table',
  TRONES: 'trones',
  DECO_ET_ACCESSOIRES: 'deco-et-accessoires',

  // Accessoires personnalisés
  BENDIR: 'bendir',
  BOUGIES: 'bougies',
  CERTIFICATS_MARIAGE: 'certificats-mariage',
  COUSSINS: 'coussins',
  FAIRE_PARTS: 'faire-parts',
  OEUFS: 'oeufs',
  TABLEAUX: 'tableaux',
  TEXTILE: 'textile',

  // Prestations
  HENNE_BOUTIQUE: 'henne-boutique',
  HENNE_DOMICILE: 'henne-domicile',
} as const

// ==================== TIME SLOTS (PRESTATIONS) ====================

export const TIME_SLOTS = {
  LUNCH: {
    id: 'LUNCH',
    label: 'Déjeuner (12h-15h30)',
    start: '12:00',
    end: '15:30',
  },
  AFTERNOON: {
    id: 'AFTERNOON',
    label: 'Après-midi (16h-20h)',
    start: '16:00',
    end: '20:00',
  },
  EVENING: {
    id: 'EVENING',
    label: 'Soirée (20h30-23h30)',
    start: '20:30',
    end: '23:30',
  },
} as const

// ==================== EMAIL CONFIGURATION ====================

export const EMAIL_CONFIG = {
  // Email service
  provider: 'resend',

  // Sender information
  from: {
    name: 'CHB Créations',
    email: 'noreply@chb-creations.fr',
  },

  // Test mode (sends to test email instead of customer)
  testMode: true,
  testEmail: 'volticthedev@gmail.com', // TODO: Disable in production

  // Email templates
  templates: {
    reservationConfirmation: 'reservation-confirmation',
    contactForm: 'contact-form',
  },
} as const

// ==================== VALIDATION RULES ====================

export const VALIDATION_RULES = {
  // Email regex
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Phone regex (French format)
  phoneRegex: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,

  // Promo code
  promoCode: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/,
  },

  // Product quantities
  quantity: {
    min: 1,
    max: 100,
  },

  // Contact form
  contactForm: {
    nameMinLength: 2,
    nameMaxLength: 100,
    subjectMinLength: 5,
    subjectMaxLength: 200,
    messageMinLength: 10,
    messageMaxLength: 2000,
  },
} as const

// ==================== SUPABASE STORAGE ====================

export const STORAGE_CONFIG = {
  // Bucket names
  buckets: {
    products: 'chb-creations-products',
    documents: 'chb-creations-documents',
  },

  // File size limits (in bytes)
  maxFileSize: {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
  },

  // Allowed file types
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf'],
} as const

// ==================== UI CONFIGURATION ====================

export const UI_CONFIG = {
  // Animation delays (in ms)
  animationDelay: 100,

  // Carousel settings
  carousel: {
    autoPlayInterval: 5000, // 5 seconds
    transitionDuration: 500,
  },

  // Pagination
  pagination: {
    defaultPageSize: 12,
    adminPageSize: 20,
  },

  // Toasts/notifications duration (in ms)
  toastDuration: 5000,
} as const

// ==================== API CONFIGURATION ====================

export const API_CONFIG = {
  // Timeout for API requests (in ms)
  requestTimeout: 30000, // 30 seconds

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
  },

  // Rate limiting (requests per minute)
  rateLimit: {
    anonymous: 60,
    authenticated: 300,
  },
} as const

// ==================== GOOGLE SERVICES ====================

export const GOOGLE_CONFIG = {
  // Places API
  places: {
    countryRestriction: 'fr', // France only
    radius: 50000, // 50km radius for searches
  },

  // Routes API
  routes: {
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
  },
} as const

// ==================== TYPE EXPORTS ====================

export type Category = typeof CATEGORIES[keyof typeof CATEGORIES]
export type Subcategory = typeof SUBCATEGORIES[keyof typeof SUBCATEGORIES]
export type TimeSlotId = keyof typeof TIME_SLOTS
export type PaymentMethod = typeof RESERVATION_CONFIG.paymentMethods[keyof typeof RESERVATION_CONFIG.paymentMethods]
