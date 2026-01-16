export interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

// Time slot type (matches SQL ENUM and src/lib/supabase.ts)
export type TimeSlot = 'LUNCH' | 'AFTERNOON' | 'EVENING'

export interface CartItem {
  id: string // unique cart item id
  productId: number
  productName: string
  productSlug: string
  productImage: string
  quantity: number
  pricePerUnit: number
  selectedOptions?: SelectedOption[] // Array of selected options (one per option group)
  personalizations?: { [key: string]: string } // Map of personalization field name to user value
  installationFees?: number // Installation fees per unit
  needsInstallation?: boolean // True if customer wants installation service
  rentalPeriod: {
    from: Date
    to: Date
  }
  startTime: string
  endTime: string
  prestationDate?: Date // For prestation items (henne, etc.) - date only
  prestationTimeSlot?: TimeSlot // Fixed time slot ENUM: 'LUNCH' | 'AFTERNOON' | 'EVENING'
  category: string
  subcategory: string
}

export type DeliveryOption = 'pickup' | 'delivery' | 'relay_point'

export interface DeliveryInfo {
  option: DeliveryOption
  address?: string
  fees: number
  distance?: number
}

export interface PromoCode {
  code: string // Code name entered by user
  discount: number // Percentage (0-100)
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  // Séparation des options de livraison par catégorie
  rentalDelivery: DeliveryInfo // Pour les locations
  purchaseDelivery: DeliveryInfo // Pour les achats d'accessoires personnalisés
  prestationDelivery: DeliveryInfo // Pour les prestations (henné, etc.)
  promoCode?: PromoCode // Code promo appliqué
}
