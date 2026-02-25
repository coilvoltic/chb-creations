'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Cart, DeliveryOption, DeliveryInfo, PromoCode, RelayProvider, RelayPointInfo } from '@/lib/cart-types'

interface CartContextType {
  cart: Cart
  addToCart: (item: Omit<CartItem, 'id'>) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setRentalDeliveryOption: (option: DeliveryOption) => void
  setPurchaseDeliveryOption: (option: DeliveryOption) => void
  setPrestationDeliveryOption: (option: DeliveryOption) => void
  setRentalDeliveryAddress: (address: string) => void
  setPurchaseDeliveryAddress: (address: string) => void
  setPrestationDeliveryAddress: (address: string) => void
  updateRentalDeliveryFees: (fees: number, distance: number) => void
  updatePurchaseDeliveryFees: (fees: number, distance: number) => void
  updatePrestationDeliveryFees: (fees: number, distance: number) => void
  setPurchaseRelayPoint: (provider: RelayProvider, relayPoint: RelayPointInfo, fees: number) => void
  setPromoCode: (promoCode: PromoCode | undefined) => void
  clearCart: () => void
  getRentalItems: () => CartItem[]
  getPurchaseItems: () => CartItem[]
  getPrestationItems: () => CartItem[]
  getSubtotal: () => number
  getDiscountAmount: () => number
  getFinalTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    rentalDelivery: {
      option: 'pickup',
      fees: 0,
    },
    purchaseDelivery: {
      option: 'pickup',
      fees: 0,
    },
    prestationDelivery: {
      option: 'pickup',
      fees: 0,
    },
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('chb-cart')
    if (savedCart) {
      try {
        interface StoredCart {
          items?: Array<Omit<CartItem, 'rentalPeriod' | 'prestationStart' | 'prestationEnd'> & {
            rentalPeriod: { from: string; to: string }
            prestationStart?: string
            prestationEnd?: string
          }>
          totalItems?: number
          totalPrice?: number
          rentalDelivery?: DeliveryInfo
          purchaseDelivery?: DeliveryInfo
          prestationDelivery?: DeliveryInfo
          promoCode?: PromoCode
        }

        const parsedCart = JSON.parse(savedCart) as StoredCart

        // Migration: handle old cart format
        const migratedCart: Cart = {
          items: parsedCart.items?.map((item) => ({
            ...item,
            rentalPeriod: {
              from: new Date(item.rentalPeriod.from),
              to: new Date(item.rentalPeriod.to),
            },
            prestationStart: item.prestationStart ? new Date(item.prestationStart) : undefined,
            prestationEnd: item.prestationEnd ? new Date(item.prestationEnd) : undefined,
          })) || [],
          totalItems: parsedCart.totalItems || 0,
          totalPrice: parsedCart.totalPrice || 0,
          rentalDelivery: parsedCart.rentalDelivery || {
            option: 'pickup' as DeliveryOption,
            fees: 0,
          },
          purchaseDelivery: parsedCart.purchaseDelivery || {
            option: 'pickup' as DeliveryOption,
            fees: 0,
          },
          prestationDelivery: parsedCart.prestationDelivery || {
            option: 'pickup' as DeliveryOption,
            fees: 0,
          },
          promoCode: parsedCart.promoCode,
        }

        setCart(migratedCart)
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Clear invalid cart
        localStorage.removeItem('chb-cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chb-cart', JSON.stringify(cart))
  }, [cart])

  // Séparer les items par catégorie
  const getRentalItems = (): CartItem[] => {
    return cart.items.filter(item => item.category === 'locations')
  }

  const getPurchaseItems = (): CartItem[] => {
    return cart.items.filter(item => item.category === 'accessoires-personnalises')
  }

  const getPrestationItems = (): CartItem[] => {
    return cart.items.filter(item => item.category === 'prestations')
  }

  const calculateTotals = (items: CartItem[]) => {
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

    return {
      totalItems,
      totalPrice,
    }
  }

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setCart((prevCart) => {
      const id = `${newItem.productId}-${Date.now()}`
      const item: CartItem = { ...newItem, id }
      const items = [...prevCart.items, item]
      const { totalItems, totalPrice } = calculateTotals(items)
      return {
        ...prevCart,
        items,
        totalItems,
        totalPrice,
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const items = prevCart.items.filter((item) => item.id !== itemId)
      const { totalItems, totalPrice } = calculateTotals(items)
      return {
        ...prevCart,
        items,
        totalItems,
        totalPrice,
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
      const { totalItems, totalPrice } = calculateTotals(items)
      return {
        ...prevCart,
        items,
        totalItems,
        totalPrice,
      }
    })
  }

  const setRentalDeliveryOption = (option: DeliveryOption) => {
    setCart((prevCart) => {
      const rentalDelivery: DeliveryInfo = {
        option,
        fees: option === 'pickup' ? 0 : prevCart.rentalDelivery.fees,
        address: option === 'pickup' ? undefined : prevCart.rentalDelivery.address,
        distance: option === 'pickup' ? undefined : prevCart.rentalDelivery.distance,
      }
      return {
        ...prevCart,
        rentalDelivery,
      }
    })
  }

  const setPurchaseDeliveryOption = (option: DeliveryOption) => {
    setCart((prevCart) => {
      const purchaseDelivery: DeliveryInfo = {
        option,
        fees: option === 'pickup' ? 0 : prevCart.purchaseDelivery.fees,
        address: option === 'pickup' ? undefined : prevCart.purchaseDelivery.address,
        distance: option === 'pickup' ? undefined : prevCart.purchaseDelivery.distance,
      }
      return {
        ...prevCart,
        purchaseDelivery,
      }
    })
  }

  const setRentalDeliveryAddress = (address: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      rentalDelivery: {
        ...prevCart.rentalDelivery,
        address,
      }
    }))
  }

  const setPurchaseDeliveryAddress = (address: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      purchaseDelivery: {
        ...prevCart.purchaseDelivery,
        address,
      }
    }))
  }

  const setPrestationDeliveryOption = (option: DeliveryOption) => {
    setCart((prevCart) => {
      const prestationDelivery: DeliveryInfo = {
        option,
        fees: option === 'pickup' ? 0 : prevCart.prestationDelivery.fees,
        address: option === 'pickup' ? undefined : prevCart.prestationDelivery.address,
        distance: option === 'pickup' ? undefined : prevCart.prestationDelivery.distance,
      }
      return {
        ...prevCart,
        prestationDelivery,
      }
    })
  }

  const setPrestationDeliveryAddress = (address: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      prestationDelivery: {
        ...prevCart.prestationDelivery,
        address,
      }
    }))
  }

  const updateRentalDeliveryFees = (fees: number, distance: number) => {
    setCart((prevCart) => ({
      ...prevCart,
      rentalDelivery: {
        ...prevCart.rentalDelivery,
        fees,
        distance,
      }
    }))
  }

  const updatePurchaseDeliveryFees = (fees: number, distance: number) => {
    setCart((prevCart) => ({
      ...prevCart,
      purchaseDelivery: {
        ...prevCart.purchaseDelivery,
        fees,
        distance,
      }
    }))
  }

  const updatePrestationDeliveryFees = (fees: number, distance: number) => {
    setCart((prevCart) => ({
      ...prevCart,
      prestationDelivery: {
        ...prevCart.prestationDelivery,
        fees,
        distance,
      }
    }))
  }

  const setPurchaseRelayPoint = (provider: RelayProvider, relayPoint: RelayPointInfo, fees: number) => {
    setCart((prevCart) => ({
      ...prevCart,
      purchaseDelivery: {
        ...prevCart.purchaseDelivery,
        option: 'relay_point',
        relayProvider: provider,
        relayPoint,
        fees,
      }
    }))
  }

  const setPromoCode = (promoCode: PromoCode | undefined) => {
    setCart((prevCart) => ({
      ...prevCart,
      promoCode,
    }))
  }

  // Calculate subtotal (before promo code discount)
  const getSubtotal = (): number => {
    return cart.totalPrice +
           (cart.rentalDelivery.fees || 0) +
           (cart.purchaseDelivery.fees || 0) +
           (cart.prestationDelivery.fees || 0)
  }

  // Calculate discount amount
  const getDiscountAmount = (): number => {
    if (!cart.promoCode || cart.promoCode.discount === 0) return 0
    const subtotal = getSubtotal()
    return (subtotal * cart.promoCode.discount) / 100
  }

  // Calculate final total (subtotal - discount)
  const getFinalTotal = (): number => {
    return getSubtotal() - getDiscountAmount()
  }

  const clearCart = () => {
    setCart({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      rentalDelivery: {
        option: 'pickup',
        fees: 0,
      },
      purchaseDelivery: {
        option: 'pickup',
        fees: 0,
      },
      prestationDelivery: {
        option: 'pickup',
        fees: 0,
      },
      promoCode: undefined,
    })
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setRentalDeliveryOption,
        setPurchaseDeliveryOption,
        setPrestationDeliveryOption,
        setRentalDeliveryAddress,
        setPurchaseDeliveryAddress,
        setPrestationDeliveryAddress,
        updateRentalDeliveryFees,
        updatePurchaseDeliveryFees,
        updatePrestationDeliveryFees,
        setPurchaseRelayPoint,
        setPromoCode,
        clearCart,
        getRentalItems,
        getPurchaseItems,
        getPrestationItems,
        getSubtotal,
        getDiscountAmount,
        getFinalTotal,
      }}
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
