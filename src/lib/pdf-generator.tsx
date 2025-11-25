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
  rentalDeliveryAddress?: string | null
  purchaseDeliveryAddress?: string | null
  rentalDeliveryFees?: number
  purchaseDeliveryFees?: number
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
  }>
  purchaseItems?: Array<{
    productName: string
    quantity: number
    pricePerUnit: number
    estimatedDeliveryDate?: string
    selectedOptions?: SelectedOption[]
    personalizations?: { [key: string]: string }
  }>
  totalPrice: number
  deposit: number
  caution: number
  rentalDeliveryOption?: 'pickup' | 'delivery'
  rentalDeliveryAddress?: string
  rentalDeliveryFees?: number
  purchaseDeliveryOption?: 'pickup' | 'delivery'
  purchaseDeliveryAddress?: string
  purchaseDeliveryFees?: number
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
                  <Text style={styles.text}>Mode: 🚚 Livraison à domicile</Text>
                  <Text style={styles.text}>Adresse: {reservation.rentalDeliveryAddress}</Text>
                  {reservation.rentalDeliveryFees && reservation.rentalDeliveryFees > 0 && (
                    <Text style={styles.text}>Frais de livraison: {reservation.rentalDeliveryFees.toFixed(2)} €</Text>
                  )}
                </>
              ) : (
                <Text style={styles.text}>Mode: 🏪 Retrait en boutique</Text>
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
                      {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                        <Text style={{ fontSize: 9, color: '#444', fontStyle: 'italic' }}>
                          {Object.entries(item.personalizations).map(([key, value]) => (
                            `\n✏️ ${key}: ${value}`
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
                  <Text style={styles.text}>Mode: 🚚 Livraison à domicile</Text>
                  <Text style={styles.text}>Adresse: {reservation.purchaseDeliveryAddress}</Text>
                  {reservation.purchaseDeliveryFees && reservation.purchaseDeliveryFees > 0 && (
                    <Text style={styles.text}>Frais de livraison: {reservation.purchaseDeliveryFees.toFixed(2)} €</Text>
                  )}
                </>
              ) : (
                <Text style={styles.text}>Mode: 🏪 Retrait en boutique</Text>
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
                            `\n✏️ ${key}: ${value}`
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

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalAmount}>{reservation.total_amount.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Informations importantes */}
        <View style={[styles.section, { marginTop: 30 }]}>
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
    rentalDeliveryAddress: params.rentalDeliveryOption === 'delivery' ? params.rentalDeliveryAddress : null,
    rentalDeliveryFees: params.rentalDeliveryFees,
    purchaseDeliveryAddress: params.purchaseDeliveryOption === 'delivery' ? params.purchaseDeliveryAddress : null,
    purchaseDeliveryFees: params.purchaseDeliveryFees,
    rentalItems: params.rentalItems?.map((item) => ({
      product_name: item.productName,
      quantity: item.quantity,
      rental_start: item.rentalStart,
      rental_end: item.rentalEnd,
      unit_price: item.pricePerUnit,
      total_price: item.quantity * item.pricePerUnit,
      selectedOptions: item.selectedOptions,
      personalizations: item.personalizations,
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
  }

  const doc = <ReservationPDF reservation={reservationData} />
  const asPdf = pdf(doc)
  const blob = await asPdf.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
