'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Cart } from '@/lib/cart-types'

interface CartContextType {
  cart: Cart
  addToCart: (item: Omit<CartItem, 'id'>) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setDeliveryOption: (option: 'pickup' | 'delivery') => void
  setDeliveryAddress: (address: string) => void
  updateDeliveryFees: (fees: number, distance: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    deliveryOption: 'pickup', // Par défaut: retrait en boutique
    totalDeliveryFees: 0,
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('chb-cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as Cart
        // Convert date strings back to Date objects
        parsedCart.items = parsedCart.items.map((item) => ({
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

  const calculateDeliveryFees = (items: CartItem[], deliveryOption: 'pickup' | 'delivery') => {
    if (deliveryOption === 'pickup') return 0

    // Calculer les frais de livraison totaux
    return items.reduce((sum, item) => {
      const deliveryFee = item.baseDeliveryFees || 0
      return sum + (deliveryFee * item.quantity)
    }, 0)
  }

  const calculateTotals = (items: CartItem[], deliveryOption: 'pickup' | 'delivery' = 'pickup') => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => {
      const basePrice = item.pricePerUnit
      // Calculate total options fees from all selected options
      const optionsFees = item.selectedOptions
        ? item.selectedOptions.reduce((fees, option) => fees + option.additional_fee, 0)
        : 0
      const installationFee = (item.needsInstallation && item.installationFees) ? item.installationFees : 0
      return sum + item.quantity * (basePrice + optionsFees + installationFee)
    }, 0)
    const totalDeliveryFees = calculateDeliveryFees(items, deliveryOption)
    return { totalItems, totalPrice, totalDeliveryFees }
  }

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setCart((prevCart) => {
      const id = `${newItem.productId}-${Date.now()}`
      const item: CartItem = { ...newItem, id }
      const items = [...prevCart.items, item]
      const { totalItems, totalPrice, totalDeliveryFees } = calculateTotals(items, prevCart.deliveryOption)
      return {
        items,
        totalItems,
        totalPrice,
        deliveryOption: prevCart.deliveryOption,
        totalDeliveryFees
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const items = prevCart.items.filter((item) => item.id !== itemId)
      const { totalItems, totalPrice, totalDeliveryFees } = calculateTotals(items, prevCart.deliveryOption)
      return {
        items,
        totalItems,
        totalPrice,
        deliveryOption: prevCart.deliveryOption,
        totalDeliveryFees
      }
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
      const { totalItems, totalPrice, totalDeliveryFees } = calculateTotals(items, prevCart.deliveryOption)
      return {
        items,
        totalItems,
        totalPrice,
        deliveryOption: prevCart.deliveryOption,
        totalDeliveryFees
      }
    })
  }

  const setDeliveryOption = (option: 'pickup' | 'delivery') => {
    setCart((prevCart) => {
      // Si on passe en mode pickup, réinitialiser les frais et l'adresse
      if (option === 'pickup') {
        return {
          ...prevCart,
          deliveryOption: option,
          deliveryAddress: undefined,
          totalDeliveryFees: 0,
          deliveryDistance: undefined
        }
      }
      // Si on passe en mode delivery, calculer les frais de base
      const { totalItems, totalPrice, totalDeliveryFees } = calculateTotals(prevCart.items, option)
      return {
        ...prevCart,
        deliveryOption: option,
        totalDeliveryFees
      }
    })
  }

  const setDeliveryAddress = (address: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      deliveryAddress: address
    }))
  }

  const updateDeliveryFees = (fees: number, distance: number) => {
    setCart((prevCart) => ({
      ...prevCart,
      totalDeliveryFees: fees,
      deliveryDistance: distance
    }))
  }

  const clearCart = () => {
    setCart({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      deliveryOption: 'pickup',
      deliveryAddress: undefined,
      totalDeliveryFees: 0,
      deliveryDistance: undefined
    })
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, setDeliveryOption, setDeliveryAddress, updateDeliveryFees, clearCart }}
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
