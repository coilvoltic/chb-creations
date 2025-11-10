'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Cart } from '@/lib/cart-types'

interface CartContextType {
  cart: Cart
  addToCart: (item: Omit<CartItem, 'id'>) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('chb-cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Convert date strings back to Date objects
        parsedCart.items = parsedCart.items.map((item: any) => ({
          ...item,
          rentalPeriod: {
            from: new Date(item.rentalPeriod.from),
            to: new Date(item.rentalPeriod.to),
          },
        }))
        setCart(parsedCart)
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chb-cart', JSON.stringify(cart))
  }, [cart])

  const calculateTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0)
    return { totalItems, totalPrice }
  }

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setCart((prevCart) => {
      const id = `${newItem.productId}-${Date.now()}`
      const item: CartItem = { ...newItem, id }
      const items = [...prevCart.items, item]
      const { totalItems, totalPrice } = calculateTotals(items)
      return { items, totalItems, totalPrice }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const items = prevCart.items.filter((item) => item.id !== itemId)
      const { totalItems, totalPrice } = calculateTotals(items)
      return { items, totalItems, totalPrice }
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart((prevCart) => {
      const items = prevCart.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
      const { totalItems, totalPrice } = calculateTotals(items)
      return { items, totalItems, totalPrice }
    })
  }

  const clearCart = () => {
    setCart({ items: [], totalItems: 0, totalPrice: 0 })
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
