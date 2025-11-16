import { DateRange } from 'react-day-picker'

export interface SelectedOption {
  name: string
  description: string
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
  selectedOption?: SelectedOption
  depositPercentage?: number
  baseDeliveryFees?: number // Base delivery fees for this product
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
