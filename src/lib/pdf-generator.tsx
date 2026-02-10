import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

// Types
interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

interface RentalItem {
  product_name: string
  quantity: number
  rental_start: string
  rental_end: string
  unit_price: number
  total_price: number
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
  installationFees?: number
  needsInstallation?: boolean
}

interface PurchaseItem {
  product_name: string
  quantity: number
  estimated_delivery_date?: string
  unit_price: number
  total_price: number
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
}

interface PrestationItem {
  product_name: string
  nb_of_people: number // Number of people for the prestation
  prestation_start?: string // ISO timestamp (date + heure de début)
  prestation_end?: string // ISO timestamp (date + heure de fin)
  unit_price: number
  total_price: number
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
}

interface ReservationData {
  id: number
  reservation_code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  created_at: string
  rentalItems?: RentalItem[]
  purchaseItems?: PurchaseItem[]
  prestationItems?: PrestationItem[]
  rentalDeliveryAddress?: string | null
  purchaseDeliveryAddress?: string | null
  prestationDeliveryAddress?: string | null
  rentalDeliveryFees?: number
  purchaseDeliveryFees?: number
  prestationDeliveryFees?: number
  deposit: number
  caution: number
  paymentType?: 'cash' | 'deposit' | 'full'
  amountPaid?: number
  promoCode?: string | null
  promoDiscount?: number | null
}

interface GenerateReservationPDFParams {
  reservationId: number
  reservationCode: string
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  rentalItems?: Array<{
    productName: string
    quantity: number
    pricePerUnit: number
    rentalStart: string
    rentalEnd: string
    selectedOptions?: SelectedOption[]
    personalizations?: { [key: string]: string }
    installationFees?: number
    needsInstallation?: boolean
  }>
  purchaseItems?: Array<{
    productName: string
    quantity: number
    pricePerUnit: number
    estimatedDeliveryDate?: string
    selectedOptions?: SelectedOption[]
    personalizations?: { [key: string]: string }
  }>
  prestationItems?: Array<{
    productName: string
    nbOfPeople: number // Number of people for the prestation
    pricePerUnit: number
    prestationStart?: string // ISO timestamp
    prestationEnd?: string // ISO timestamp
    selectedOptions?: SelectedOption[]
    personalizations?: { [key: string]: string }
  }>
  totalPrice: number
  deposit: number
  caution: number
  paymentType?: 'cash' | 'deposit' | 'full' // Type de paiement effectué
  amountPaid?: number // Montant effectivement payé (pour paiement intégral)
  rentalDeliveryOption?: 'pickup' | 'delivery'
  rentalDeliveryAddress?: string
  rentalDeliveryFees?: number
  purchaseDeliveryOption?: 'pickup' | 'delivery'
  purchaseDeliveryAddress?: string
  purchaseDeliveryFees?: number
  prestationDeliveryOption?: 'pickup' | 'delivery'
  prestationDeliveryAddress?: string
  prestationDeliveryFees?: number
}

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  text: {
    fontSize: 11,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    padding: 10,
    fontWeight: 'bold',
    borderBottom: '1 solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #e5e5e5',
  },
  col1: { width: '35%' },
  col2: { width: '15%' },
  col3: { width: '25%' },
  col4: { width: '25%' },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 20,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
    borderTop: '1 solid #e5e5e5',
    paddingTop: 10,
  },
})

// Composant PDF
export const ReservationPDF: React.FC<{ reservation: ReservationData }> = ({ reservation }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header avec logo */}
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>CHB Créations</Text>
            <Text style={{ fontSize: 10, color: '#666', marginTop: 5 }}>Marseille</Text>
          </View>
          <View>
            <Text style={styles.title}>Confirmation de réservation</Text>
            <Text style={{ fontSize: 10, textAlign: 'right', marginTop: 5 }}>
              N° {reservation.reservation_code}
            </Text>
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          <Text style={styles.text}>Nom: {reservation.customer_name}</Text>
          <Text style={styles.text}>Email: {reservation.customer_email}</Text>
          <Text style={styles.text}>Téléphone: {reservation.customer_phone}</Text>
          <Text style={styles.text}>
            Date de réservation: {formatDateTime(reservation.created_at)}
          </Text>
        </View>

        {/* Section LOCATIONS */}
        {reservation.rentalItems && reservation.rentalItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#1e40af' }]}>
              Locations ({reservation.rentalItems.length} article{reservation.rentalItems.length > 1 ? 's' : ''})
            </Text>

            {/* Livraison Locations */}
            <View style={{ marginBottom: 15, paddingLeft: 10, borderLeft: '3 solid #3b82f6' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e40af', marginBottom: 5 }}>
                LIVRAISON
              </Text>
              {reservation.rentalDeliveryAddress ? (
                <>
                  <Text style={styles.text}>Mode: Livraison à domicile</Text>
                  <Text style={styles.text}>Adresse: {reservation.rentalDeliveryAddress}</Text>
                  {reservation.rentalDeliveryFees && reservation.rentalDeliveryFees > 0 && (
                    <Text style={styles.text}>Frais de livraison: {reservation.rentalDeliveryFees.toFixed(2)} €</Text>
                  )}
                </>
              ) : (
                <Text style={styles.text}>Mode: Retrait en boutique</Text>
              )}
            </View>

            {/* Table Locations */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Article</Text>
                <Text style={styles.col2}>Quantité</Text>
                <Text style={styles.col3}>Période</Text>
                <Text style={styles.col4}>Prix</Text>
              </View>

              {reservation.rentalItems.map((item: RentalItem, index: number) => (
                <View key={index}>
                  <View style={styles.tableRow}>
                    <Text style={styles.col1}>
                      {item.product_name}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <Text style={{ fontSize: 9, color: '#666' }}>
                          {item.selectedOptions.map((option: SelectedOption) => (
                            `\n${option.option_type_name}: ${option.name}`
                          )).join('')}
                        </Text>
                      )}
                      {item.needsInstallation && item.installationFees && (
                        <Text style={{ fontSize: 9, color: '#d97706', fontWeight: 'bold' }}>
                          {`\n+ Installation (+${item.installationFees.toFixed(2)} €/unité)`}
                        </Text>
                      )}
                      {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                        <Text style={{ fontSize: 9, color: '#444', fontStyle: 'italic' }}>
                          {Object.entries(item.personalizations).map(([key, value]) => (
                            `\n${key}: ${value}`
                          )).join('')}
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.col2}>{item.quantity}</Text>
                    <Text style={styles.col3}>
                      {formatDate(item.rental_start)} - {formatDate(item.rental_end)}
                    </Text>
                    <Text style={styles.col4}>{item.total_price.toFixed(2)} €</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section ACHATS */}
        {reservation.purchaseItems && reservation.purchaseItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#15803d' }]}>
              Achats ({reservation.purchaseItems.length} article{reservation.purchaseItems.length > 1 ? 's' : ''})
            </Text>

            {/* Livraison Achats */}
            <View style={{ marginBottom: 15, paddingLeft: 10, borderLeft: '3 solid #22c55e' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#15803d', marginBottom: 5 }}>
                LIVRAISON
              </Text>
              {reservation.purchaseDeliveryAddress ? (
                <>
                  {reservation.purchaseDeliveryAddress.startsWith('[Point Relais') ? (
                    <>
                      <Text style={styles.text}>Mode: Point Relais</Text>
                      <Text style={styles.text}>
                        {reservation.purchaseDeliveryAddress.replace(/^\[Point Relais [^\]]+\]\s*/, '')}
                      </Text>
                      {reservation.purchaseDeliveryFees && reservation.purchaseDeliveryFees > 0 && (
                        <Text style={styles.text}>Frais de livraison: {reservation.purchaseDeliveryFees.toFixed(2)} €</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.text}>Mode: Livraison à domicile</Text>
                      <Text style={styles.text}>Adresse: {reservation.purchaseDeliveryAddress}</Text>
                      {reservation.purchaseDeliveryFees && reservation.purchaseDeliveryFees > 0 && (
                        <Text style={styles.text}>Frais de livraison: {reservation.purchaseDeliveryFees.toFixed(2)} €</Text>
                      )}
                    </>
                  )}
                </>
              ) : (
                <Text style={styles.text}>Mode: Retrait en boutique</Text>
              )}
            </View>

            {/* Table Achats */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Article</Text>
                <Text style={styles.col2}>Quantité</Text>
                <Text style={styles.col3}>Livraison estimée</Text>
                <Text style={styles.col4}>Prix</Text>
              </View>

              {reservation.purchaseItems.map((item: PurchaseItem, index: number) => (
                <View key={index}>
                  <View style={styles.tableRow}>
                    <Text style={styles.col1}>
                      {item.product_name}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <Text style={{ fontSize: 9, color: '#666' }}>
                          {item.selectedOptions.map((option: SelectedOption) => (
                            `\n${option.option_type_name}: ${option.name}`
                          )).join('')}
                        </Text>
                      )}
                      {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                        <Text style={{ fontSize: 9, color: '#444', fontStyle: 'italic' }}>
                          {Object.entries(item.personalizations).map(([key, value]) => (
                            `\n${key}: ${value}`
                          )).join('')}
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.col2}>{item.quantity}</Text>
                    <Text style={styles.col3}>
                      {item.estimated_delivery_date ? formatDate(item.estimated_delivery_date) : 'À définir'}
                    </Text>
                    <Text style={styles.col4}>{item.total_price.toFixed(2)} €</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section PRESTATIONS */}
        {reservation.prestationItems && reservation.prestationItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#7c3aed' }]}>
              Prestations ({reservation.prestationItems.length} prestation{reservation.prestationItems.length > 1 ? 's' : ''})
            </Text>

            {/* Lieu de prestation */}
            <View style={{ marginBottom: 15, paddingLeft: 10, borderLeft: '3 solid #a78bfa' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#7c3aed', marginBottom: 5 }}>
                LIEU DE PRESTATION
              </Text>
              {reservation.prestationDeliveryAddress ? (
                <>
                  <Text style={styles.text}>Mode: À domicile</Text>
                  <Text style={styles.text}>Adresse: {reservation.prestationDeliveryAddress}</Text>
                  {reservation.prestationDeliveryFees && reservation.prestationDeliveryFees > 0 && (
                    <Text style={styles.text}>Frais de déplacement: {reservation.prestationDeliveryFees.toFixed(2)} €</Text>
                  )}
                </>
              ) : (
                <Text style={styles.text}>Mode: En boutique</Text>
              )}
            </View>

            {/* Table Prestations */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Article</Text>
                <Text style={styles.col2}>Nb. personnes</Text>
                <Text style={styles.col3}>Date & Heure</Text>
                <Text style={styles.col4}>Prix</Text>
              </View>

              {reservation.prestationItems.map((item: PrestationItem, index: number) => (
                <View key={index}>
                  <View style={styles.tableRow}>
                    <Text style={styles.col1}>
                      {item.product_name}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <Text style={{ fontSize: 9, color: '#666' }}>
                          {item.selectedOptions.map((option: SelectedOption) => (
                            `\n${option.option_type_name}: ${option.name}`
                          )).join('')}
                        </Text>
                      )}
                      {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                        <Text style={{ fontSize: 9, color: '#444', fontStyle: 'italic' }}>
                          {Object.entries(item.personalizations).map(([key, value]) => (
                            `\n${key}: ${value}`
                          )).join('')}
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.col2}>{item.nb_of_people}</Text>
                    <Text style={styles.col3}>
                      {item.prestation_start && item.prestation_end ? (
                        `${formatDate(item.prestation_start)} de ${formatTime(item.prestation_start)} à ${formatTime(item.prestation_end)}`
                      ) : (
                        'À définir'
                      )}
                    </Text>
                    <Text style={styles.col4}>{item.total_price.toFixed(2)} €</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Total Section */}
        <View style={styles.totalSection}>
          {/* Calculate subtotal (items + delivery fees) */}
          {reservation.promoCode && reservation.promoDiscount ? (
            <>
              {/* Subtotal before discount */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#666' }}>Sous-total:</Text>
                <Text style={{ fontSize: 11, color: '#666' }}>
                  {(reservation.total_amount / (1 - reservation.promoDiscount / 100)).toFixed(2)} €
                </Text>
              </View>
              {/* Promo code discount */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  Réduction ({reservation.promoCode} -{reservation.promoDiscount}%):
                </Text>
                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  -{(reservation.total_amount / (1 - reservation.promoDiscount / 100) * (reservation.promoDiscount / 100)).toFixed(2)} €
                </Text>
              </View>
            </>
          ) : null}
          {/* Final total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalAmount}>{reservation.total_amount.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Montant déjà payé et Caution */}
        {(reservation.deposit > 0 || reservation.caution > 0 || reservation.paymentType === 'full') && (
          <View style={[styles.section, { marginTop: 15, paddingTop: 15, borderTop: '1pt solid #e5e7eb' }]}>
            {/* Afficher le paiement intégral si applicable */}
            {reservation.paymentType === 'full' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  ✓ Déjà payé (Totalité) :
                </Text>
                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  {(reservation.amountPaid || reservation.total_amount).toFixed(2)} €
                </Text>
              </View>
            )}
            {/* Afficher le montant déjà payé si paiement d'acompte */}
            {reservation.paymentType === 'deposit' && reservation.deposit > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  ✓ Déjà payé :
                </Text>
                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  {reservation.deposit.toFixed(2)} €
                </Text>
              </View>
            )}
            {/* Afficher l'acompte à payer si paiement en boutique */}
            {reservation.paymentType === 'cash' && reservation.deposit > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>
                  💳 Acompte à régler en boutique :
                </Text>
                <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>
                  {reservation.deposit.toFixed(2)} €
                </Text>
              </View>
            )}
            {/* Afficher le solde restant si non paiement intégral */}
            {reservation.paymentType !== 'full' && reservation.deposit > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  Solde restant :
                </Text>
                <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: 'bold' }}>
                  {(reservation.total_amount - reservation.deposit).toFixed(2)} €
                </Text>
              </View>
            )}
            {reservation.caution > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#d97706', fontWeight: 'bold' }}>
                  ⚠️ Caution :
                </Text>
                <Text style={{ fontSize: 11, color: '#d97706', fontWeight: 'bold' }}>
                  {reservation.caution.toFixed(2)} €
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic', marginTop: 8 }}>
              {reservation.paymentType === 'full' && "Paiement intégral effectué - Plus rien à payer ! "}
              {reservation.paymentType === 'deposit' && reservation.deposit > 0 && `Le solde de ${(reservation.total_amount - reservation.deposit).toFixed(2)} € sera à régler lors de la récupération ou livraison. `}
              {reservation.paymentType === 'cash' && reservation.deposit > 0 && "L'acompte est à payer en boutique pour valider la commande. "}
              {reservation.caution > 0 && "La caution sera demandée à la récupération (non encaissée sauf dommage)."}
            </Text>
          </View>
        )}

        {/* Informations importantes */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Informations importantes</Text>
          <Text style={styles.text}>
            • Les articles doivent être récupérés à la date convenue
          </Text>
          <Text style={styles.text}>
            • Une caution pourra être demandée lors de la récupération
          </Text>
          <Text style={styles.text}>
            • Les articles doivent être retournés dans l&apos;état dans lequel ils ont été loués
          </Text>
          <Text style={styles.text}>
            • Pour toute question, n&apos;hésitez pas à nous contacter
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>CHB Créations - Marseille</Text>
          <Text>Email: chaymaeb.creations@gmail.com</Text>
          <Text style={{ marginTop: 5 }}>
            Merci de votre confiance !
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// Fonction pour générer le PDF et le retourner en Buffer
export async function generateReservationPDF(params: GenerateReservationPDFParams): Promise<Buffer> {
  const reservationData: ReservationData = {
    id: params.reservationId,
    reservation_code: params.reservationCode,
    customer_name: `${params.customerInfo.firstName} ${params.customerInfo.lastName}`,
    customer_email: params.customerInfo.email,
    customer_phone: params.customerInfo.phone,
    total_amount: params.totalPrice,
    created_at: new Date().toISOString(),
    deposit: params.deposit,
    caution: params.caution,
    paymentType: params.paymentType,
    amountPaid: params.amountPaid,
    rentalDeliveryAddress: params.rentalDeliveryOption === 'delivery' ? params.rentalDeliveryAddress : null,
    rentalDeliveryFees: params.rentalDeliveryFees,
    purchaseDeliveryAddress: params.purchaseDeliveryOption === 'delivery' ? params.purchaseDeliveryAddress : null,
    purchaseDeliveryFees: params.purchaseDeliveryFees,
    prestationDeliveryAddress: params.prestationDeliveryOption === 'delivery' ? params.prestationDeliveryAddress : null,
    prestationDeliveryFees: params.prestationDeliveryFees,
    rentalItems: params.rentalItems?.map((item) => ({
      product_name: item.productName,
      quantity: item.quantity,
      rental_start: item.rentalStart,
      rental_end: item.rentalEnd,
      unit_price: item.pricePerUnit,
      total_price: item.quantity * item.pricePerUnit,
      selectedOptions: item.selectedOptions,
      personalizations: item.personalizations,
      installationFees: item.installationFees,
      needsInstallation: item.needsInstallation,
    })),
    purchaseItems: params.purchaseItems?.map((item) => ({
      product_name: item.productName,
      quantity: item.quantity,
      estimated_delivery_date: item.estimatedDeliveryDate,
      unit_price: item.pricePerUnit,
      total_price: item.quantity * item.pricePerUnit,
      selectedOptions: item.selectedOptions,
      personalizations: item.personalizations,
    })),
    prestationItems: params.prestationItems?.map((item) => ({
      product_name: item.productName,
      nb_of_people: item.nbOfPeople || 1,
      prestation_start: item.prestationStart,
      prestation_end: item.prestationEnd,
      unit_price: item.pricePerUnit,
      total_price: (item.nbOfPeople || 1) * item.pricePerUnit,
      selectedOptions: item.selectedOptions,
      personalizations: item.personalizations,
    })),
  }

  const doc = <ReservationPDF reservation={reservationData} />
  const asPdf = pdf(doc)
  const blob = await asPdf.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
