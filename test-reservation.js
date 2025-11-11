// Test script to verify Supabase RLS policies
// Run with: node test-reservation.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sqxlcbmntzpealuxxsya.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeGxjYm1udHpwZWFsdXh4c3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODU2NjIsImV4cCI6MjA3ODI2MTY2Mn0.Srq4MSSjCEaUiX-1dTie0uxVyYNuclRgZnTT3SBRQGA'

// Create client with same config as API route
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function testReservationInsert() {
  console.log('🧪 Testing reservation insert with anon role...\n')

  const testData = {
    customer_infos: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '0612345678',
    },
    deposit: 50.0,
    caution: 100.0,
    reservation_status: 'CONFIRMED',
    total_price: 100.0,
  }

  console.log('📝 Attempting to insert:', JSON.stringify(testData, null, 2))

  const { data, error } = await supabase
    .from('reservations')
    .insert(testData)
    .select()
    .single()

  if (error) {
    console.error('❌ ERROR:', error)
    console.error('\nError details:')
    console.error('- Code:', error.code)
    console.error('- Message:', error.message)
    console.error('- Details:', error.details)
    console.error('- Hint:', error.hint)
    return
  }

  console.log('✅ SUCCESS! Reservation created:', data)

  // Clean up test data
  if (data && data.id) {
    console.log('\n🧹 Cleaning up test reservation...')
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', data.id)

    if (deleteError) {
      console.log('⚠️  Could not delete test reservation (expected - anon role cannot delete)')
      console.log('   ID:', data.id, '- Please delete manually or run as authenticated user')
    } else {
      console.log('✅ Test reservation deleted')
    }
  }
}

// Run test
testReservationInsert().catch(console.error)
