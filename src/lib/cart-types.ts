import { DateRange } from 'react-day-picker'

export interface CartItem {
  id: string // unique cart item id
  productId: number
  productName: string
  productSlug: string
  productImage: string
  quantity: number
  pricePerUnit: number
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
}
