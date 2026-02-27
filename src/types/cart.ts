/**
 * Cart types - Shopping cart and delivery related interfaces
 */

import type { ItemOption } from './database'

export interface CartItem {
  id: string // unique cart item id
  productId: number
  productName: string
  productSlug: string
  productImage: string
  quantity: number
  numberOfPeople?: number // For prestation items (henné) - number of people
  pricePerUnit: number
  selectedOptions?: ItemOption[] // Array of selected options (one per option group)
  personalizations?: Record<string, string> // Map of personalization field name to user value
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

export interface RelayPointInfo {
  id: string
  name: string
  address: string
  distance: number // en km
  provider: 'chronopost' | 'mondialrelay'
}

export interface DeliveryInfo {
  option: 'pickup' | 'delivery' | 'relay_point'
  address?: string // Adresse de livraison à domicile OU adresse client pour recherche de points relais
  fees: number
  distance?: number
  // Pour les points relais uniquement
  relayProvider?: 'chronopost' | 'mondialrelay'
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
  prestationDelivery: DeliveryInfo // Pour les prestations homogènes (boutique seul OU domicile seul)
  // Uniquement utilisés quand le panier contient à la fois des prestations boutique et domicile
  prestationBoutiqueDelivery?: DeliveryInfo
  prestationDomicileDelivery?: DeliveryInfo
  promoCode?: PromoCode // Code promo appliqué
}
