export interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
  duration?: number // Durée en minutes (pour prestations boutique uniquement)
}

export interface CartItem {
  id: string // unique cart item id
  productId: number
  productName: string
  productSlug: string
  productImage: string
  quantity: number
  numberOfPeople?: number // For prestation items (henné) - number of people
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
  prestationStart?: Date // For prestation items - date + heure de début
  prestationEnd?: Date // For prestation items - date + heure de fin
  category: string
  subcategory: string
}

export type DeliveryOption = 'pickup' | 'delivery' | 'relay_point'

export type RelayProvider = 'chronopost' | 'mondialrelay'

export interface RelayPointInfo {
  id: string
  name: string
  address: string
  distance: number // en km
  provider: RelayProvider
}

export interface DeliveryInfo {
  option: DeliveryOption
  address?: string // Adresse de livraison à domicile OU adresse client pour recherche de points relais
  fees: number
  distance?: number
  // Pour les points relais uniquement
  relayProvider?: RelayProvider
  relayPoint?: RelayPointInfo
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
