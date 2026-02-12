import type { ItemOption } from '@/types/database'

/**
 * Format standard pour stocker les options d'un item de réservation en base.
 * Utilisé par rental_items, purchase_items et prestation_items.
 */
export interface ReservationItemOptions {
  selectedOptions?: ItemOption[]
  installationFees?: number
}

/**
 * Construit l'objet d'options à stocker en base pour un item de réservation.
 * Factorise la logique commune entre les 3 types d'items (rental, purchase, prestation).
 */
export function buildItemOptionsData(
  selectedOptions?: ItemOption[],
  installationFees?: number
): ReservationItemOptions | null {
  if (selectedOptions && selectedOptions.length > 0) {
    return { selectedOptions, installationFees }
  }
  if (installationFees) {
    return { installationFees }
  }
  return null
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
