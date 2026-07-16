import type { ItemOption } from '@/types/database'

/**
 * Format standard pour stocker les options d'un item de réservation en base.
 * Utilisé par rental_items, purchase_items et prestation_items.
 */
export interface ReservationItemOptions {
  selectedOptions?: ItemOption[]
  installationFees?: number
  unitPrice?: number // Prix unitaire réel payé (inclut new_price si promo)
}

/**
 * Construit l'objet d'options à stocker en base pour un item de réservation.
 * Factorise la logique commune entre les 3 types d'items (rental, purchase, prestation).
 */
export function buildItemOptionsData(
  selectedOptions?: ItemOption[],
  installationFees?: number,
  unitPrice?: number
): ReservationItemOptions | null {
  const result: ReservationItemOptions = {}
  if (selectedOptions && selectedOptions.length > 0) result.selectedOptions = selectedOptions
  if (installationFees) result.installationFees = installationFees
  if (unitPrice !== undefined) result.unitPrice = unitPrice
  return Object.keys(result).length > 0 ? result : null
}

/**
 * Normalise les options d'un item depuis la base de données.
 * Gère l'ancien format (tableau brut) et le nouveau format ({selectedOptions: [...]}).
 */
export function getSelectedOptionsFromDB(
  options: ReservationItemOptions | ItemOption[] | null | undefined
): ItemOption[] {
  if (!options) return []
  if (Array.isArray(options)) return options
  return options.selectedOptions ?? []
}

/**
 * Récupère les frais d'installation depuis les options stockées en base.
 */
export function getInstallationFeesFromDB(
  options: ReservationItemOptions | ItemOption[] | null | undefined
): number {
  if (!options || Array.isArray(options)) return 0
  return options.installationFees ?? 0
}

// ==================== DISPONIBILITÉ RETRAIT/RESTITUTION LOCATIONS ====================

/** Durée bloquée (en minutes) pour un retrait ou une restitution de location. */
export const RENTAL_BLOCK_MINUTES = 30

export interface TimeWindow {
  start: string // ISO timestamp
  end: string // ISO timestamp
}

/**
 * Vérifie si le créneau de 30 min démarrant à `instant` chevauche l'un des créneaux occupés.
 */
export function isRentalMomentBlocked(instant: Date, blockedWindows: TimeWindow[]): boolean {
  const momentEnd = new Date(instant.getTime() + RENTAL_BLOCK_MINUTES * 60000)
  return blockedWindows.some((window) => {
    const blockedStart = new Date(window.start)
    const blockedEnd = new Date(window.end)
    return instant < blockedEnd && momentEnd > blockedStart
  })
}

/**
 * Vérifie si le retrait ou la restitution d'une location (chacun bloquant 30 min, peu importe
 * le mode de livraison ou la quantité) chevauche un créneau déjà occupé : prestation henné
 * confirmée, ou retrait/restitution d'une autre location confirmée.
 * Retourne 'pickup', 'return', ou null si aucun conflit.
 */
export function findRentalTimeConflict(
  rentalStart: string,
  rentalEnd: string,
  blockedWindows: TimeWindow[]
): 'pickup' | 'return' | null {
  if (isRentalMomentBlocked(new Date(rentalStart), blockedWindows)) return 'pickup'
  if (isRentalMomentBlocked(new Date(rentalEnd), blockedWindows)) return 'return'
  return null
}
