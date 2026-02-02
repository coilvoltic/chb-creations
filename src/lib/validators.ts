/**
 * Validation schemas using Zod
 * Centralized validation for API routes and forms
 */

import { z } from 'zod'
import { VALIDATION_RULES } from '@/config/constants'

// ==================== CUSTOMER INFO ====================

export const customerInfoSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(
    VALIDATION_RULES.phoneRegex,
    'Numéro de téléphone invalide'
  ),
})

// ==================== DELIVERY ====================

export const deliveryInfoSchema = z.object({
  option: z.enum(['pickup', 'delivery', 'relay_point']),
  address: z.string().optional(),
  fees: z.number().min(0),
  distance: z.number().min(0).optional(),
  relayProvider: z.enum(['chronopost', 'mondialrelay']).optional(),
  relayPoint: z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    distance: z.number(),
    provider: z.enum(['chronopost', 'mondialrelay']),
  }).optional(),
})

export const calculateDeliverySchema = z.object({
  deliveryAddress: z.string().min(5, 'Adresse de livraison requise'),
  category: z.enum(['locations', 'accessoires-personnalises', 'prestations']),
})

// ==================== PRODUCT OPTIONS ====================

export const itemOptionSchema = z.object({
  option_type_name: z.string(),
  name: z.string(),
  description: z.string().optional(),
  additional_fee: z.number().min(0),
  duration: z.number().min(0).optional(),
})

// ==================== CART ITEMS ====================

export const cartItemPayloadSchema = z.object({
  productId: z.number().int().positive(),
  productName: z.string().min(1),
  category: z.enum(['locations', 'accessoires-personnalises', 'prestations']),
  quantity: z.number().int().min(1).max(VALIDATION_RULES.quantity.max),
  numberOfPeople: z.number().int().min(1).optional(),
  pricePerUnit: z.number().min(0),
  rentalStart: z.string(), // ISO timestamp
  rentalEnd: z.string(), // ISO timestamp
  prestationStart: z.string().optional(), // ISO timestamp
  prestationEnd: z.string().optional(), // ISO timestamp
  selectedOptions: z.array(itemOptionSchema).optional(),
  personalizations: z.record(z.string(), z.string()).optional(),
  needsInstallation: z.boolean().optional(),
  installationFees: z.number().min(0).optional(),
})

// ==================== PROMO CODE ====================

export const promoCodePayloadSchema = z.object({
  code: z.string()
    .min(VALIDATION_RULES.promoCode.minLength)
    .max(VALIDATION_RULES.promoCode.maxLength)
    .regex(VALIDATION_RULES.promoCode.pattern, 'Code promo invalide (lettres majuscules et chiffres uniquement)'),
  discount: z.number().min(0).max(100),
})

export const validatePromoCodeRequestSchema = z.object({
  code: z.string()
    .min(VALIDATION_RULES.promoCode.minLength)
    .max(VALIDATION_RULES.promoCode.maxLength),
})

// ==================== RESERVATION ====================

export const createReservationPayloadSchema = z.object({
  customerInfo: customerInfoSchema,
  items: z.array(cartItemPayloadSchema).min(1, 'Au moins un article requis'),
  deposit: z.number().min(0),
  caution: z.number().min(0),
  rentalDelivery: deliveryInfoSchema.optional(),
  purchaseDelivery: deliveryInfoSchema.optional(),
  prestationDelivery: deliveryInfoSchema.optional(),
  totalPrice: z.number().min(0),
  promoCode: promoCodePayloadSchema.optional(),
  paymentMethod: z.enum(['online', 'cash']).nullable().optional(),
  userId: z.string().optional(),
})

// ==================== CONTACT FORM ====================

export const contactFormSchema = z.object({
  name: z.string()
    .min(VALIDATION_RULES.contactForm.nameMinLength, 'Le nom doit contenir au moins 2 caractères')
    .max(VALIDATION_RULES.contactForm.nameMaxLength),
  email: z.string().email('Email invalide'),
  subject: z.string()
    .min(VALIDATION_RULES.contactForm.subjectMinLength, 'Le sujet doit contenir au moins 5 caractères')
    .max(VALIDATION_RULES.contactForm.subjectMaxLength),
  message: z.string()
    .min(VALIDATION_RULES.contactForm.messageMinLength, 'Le message doit contenir au moins 10 caractères')
    .max(VALIDATION_RULES.contactForm.messageMaxLength),
})

// ==================== STRIPE ====================

export const createCheckoutSessionSchema = z.object({
  amount: z.number().min(0),
  customerInfo: customerInfoSchema,
  items: z.array(cartItemPayloadSchema).min(1),
  deposit: z.number().min(0),
  caution: z.number().min(0),
  rentalDelivery: deliveryInfoSchema.optional(),
  purchaseDelivery: deliveryInfoSchema.optional(),
  prestationDelivery: deliveryInfoSchema.optional(),
  totalPrice: z.number().min(0),
  promoCode: promoCodePayloadSchema.optional(),
  userId: z.string().optional(),
})

// ==================== TYPE EXPORTS ====================

export type CustomerInfoInput = z.infer<typeof customerInfoSchema>
export type DeliveryInfoInput = z.infer<typeof deliveryInfoSchema>
export type CartItemPayloadInput = z.infer<typeof cartItemPayloadSchema>
export type PromoCodePayloadInput = z.infer<typeof promoCodePayloadSchema>
export type CreateReservationPayloadInput = z.infer<typeof createReservationPayloadSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>
