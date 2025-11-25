/**
 * Génère un code de réservation unique à 8 caractères
 * Format: Lettres majuscules et chiffres (ex: A3B7K9M2)
 */
export function generateReservationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclu I, O, 0, 1 pour éviter confusion
  let code = ''

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}
