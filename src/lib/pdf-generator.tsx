import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

// Types
interface ReservationItem {
  product_name: string
  quantity: number
  rental_start: string
  rental_end: string
  unit_price: number
  total_price: number
}

interface ReservationData {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  created_at: string
  items: ReservationItem[]
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
              N° #{reservation.id}
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

        {/* Articles réservés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles réservés</Text>
          <View style={styles.table}>
            {/* En-tête du tableau */}
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Article</Text>
              <Text style={styles.col2}>Quantité</Text>
              <Text style={styles.col3}>Période</Text>
              <Text style={styles.col4}>Prix</Text>
            </View>

            {/* Lignes du tableau */}
            {reservation.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.col1}>{item.product_name}</Text>
                <Text style={styles.col2}>{item.quantity}</Text>
                <Text style={styles.col3}>
                  {formatDate(item.rental_start)} - {formatDate(item.rental_end)}
                </Text>
                <Text style={styles.col4}>{item.total_price.toFixed(2)} €</Text>
              </View>
            ))}
          </View>
        </View>

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
