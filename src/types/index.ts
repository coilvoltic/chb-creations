/**
 * Central type exports
 * Single point of import for all application types
 */

// Database types
export type {
  // Enums
  ReservationStatus,
  DeliveryOption,
  RelayProvider,

  // Customer
  CustomerInfo,

  // Products
  Product,
  ProductListing,
  ProductOption,
  ProductOptionGroup,
  FAQItem,
  UnavailabilityEntry,
  PrestationUnavailableSlot,
  LocationUnavailableWindow,

  // Orders & Reservations
  CustomerOrder,
  RentalReservation,
  RentalItem,
  PurchaseReservation,
  PurchaseItem,
  PrestationReservation,
  PrestationItem,
  ItemOption,

  // Tags
  Tag,
  ReservationTag,

  // App Settings
  AppSettings,
  BoutiqueTimeSlot,
  BoutiqueHoursDefault,
  BoutiqueHoursException,

  // Promotional
  PromotionalCode,
  PromotionalMessage,

  // Legacy (deprecated)
  Reservation,
  ReservationItem,
  RentalItemOption,
} from './database'

// Cart types
export type {
  Cart,
  CartItem,
  DeliveryInfo,
  RelayPointInfo,
  PromoCode,
} from './cart'

// API types
export type {
  // Reservation
  CartItemPayload,
  PromoCodePayload,
  CreateReservationPayload,
  CreateReservationResponse,

  // Delivery
  CalculateDeliveryRequest,
  CalculateDeliveryResponse,

  // Promo code
  ValidatePromoCodeRequest,
  ValidatePromoCodeResponse,

  // Contact
  ContactFormPayload,
  ContactFormResponse,

  // Stripe
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from './api'
