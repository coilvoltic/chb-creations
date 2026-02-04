/**
 * Palette de couleurs prédéfinies pour les tags
 * Chaque couleur a un nom convivial et un code hexadécimal
 */

export interface TagColorOption {
  name: string
  hex: string
}

export const TAG_COLOR_PALETTE: TagColorOption[] = [
  { name: 'Rouge', hex: '#EF4444' },
  { name: 'Vert', hex: '#10B981' },
  { name: 'Bleu', hex: '#3B82F6' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#EC4899' },
  { name: 'Ambre', hex: '#F59E0B' },
]

/**
 * Trouve le nom de la couleur à partir de son code hexadécimal
 */
export function getColorName(hex: string): string {
  const color = TAG_COLOR_PALETTE.find(c => c.hex.toUpperCase() === hex.toUpperCase())
  return color?.name || hex
}

/**
 * Valide si un code hexadécimal est dans la palette
 */
export function isValidTagColor(hex: string): boolean {
  return TAG_COLOR_PALETTE.some(c => c.hex.toUpperCase() === hex.toUpperCase())
}
