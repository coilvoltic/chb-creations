import { DateRange } from 'react-day-picker'

export interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

export interface CartItem {
  id: string // unique cart item id
  productId: number
  productName: string
  productSlug: string
  productImage: string
  quantity: number
  pricePerUnit: number
  selectedOptions?: SelectedOption[] // Array of selected options (one per option group)
  depositPercentage?: number
  cautionPerUnit?: number // Security deposit per unit (not charged unless damage/loss)
  baseDeliveryFees?: number // Base delivery fees for this product
  installationFees?: number // Installation fees per unit
  needsInstallation?: boolean // True if customer wants installation service
  rentalPeriod: {
    from: Date
    to: Date
  }
  startTime: string
  endTime: string
  category: string
  subcategory: string
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  deliveryOption?: 'pickup' | 'delivery' // pickup = retrait en boutique, delivery = livraison
  deliveryAddress?: string // Adresse de livraison
  totalDeliveryFees?: number
  deliveryDistance?: number // Distance en km
}
