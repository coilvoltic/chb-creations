// Script de test pour vérifier l'accès au bucket Supabase
// Usage: node test-bucket.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Test de connexion au bucket Supabase\n')
console.log('URL Supabase:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? '✅ Présente' : '❌ Manquante')
console.log('Service Role Key:', supabaseServiceRoleKey ? '✅ Présente' : '❌ Manquante')
console.log('\n---\n')

async function testBucket() {
  // Test avec anon key
  console.log('📦 Test 1: Liste des buckets (avec anon key)')
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data: buckets, error } = await supabaseAnon.storage.listBuckets()

    if (error) {
      console.log('❌ Erreur:', error.message)
    } else {
      console.log('✅ Buckets trouvés:')
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.id} ${bucket.public ? '(public)' : '(private)'}`)
      })
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }

  console.log('\n---\n')

  // Test avec service role key
  console.log('📦 Test 2: Liste des buckets (avec service role key)')
  const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey)

  try {
    const { data: buckets, error } = await supabaseService.storage.listBuckets()

    if (error) {
      console.log('❌ Erreur:', error.message)
    } else {
      console.log('✅ Buckets trouvés:')
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.id} ${bucket.public ? '(public)' : '(private)'}`)
      })
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }

  console.log('\n---\n')

  // Test d'accès au bucket spécifique
  console.log('📦 Test 3: Accès au bucket "chb-creations-products"')

  try {
    const { data: files, error } = await supabaseService.storage
      .from('chb-creations-products')
      .list()

    if (error) {
      console.log('❌ Erreur:', error.message)
      console.log('   Code:', error.statusCode)
    } else {
      console.log('✅ Bucket accessible!')
      console.log(`   ${files.length} fichiers/dossiers trouvés`)
      if (files.length > 0) {
        console.log('   Premiers éléments:')
        files.slice(0, 5).forEach(file => {
          console.log(`     - ${file.name}`)
        })
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }

  console.log('\n---\n')

  // Test d'accès à l'ancien bucket
  console.log('📦 Test 4: Accès à l\'ancien bucket "CHB Creation Products"')

  try {
    const { data: files, error } = await supabaseService.storage
      .from('CHB Creation Products')
      .list()

    if (error) {
      console.log('❌ Erreur:', error.message)
    } else {
      console.log('✅ Ancien bucket toujours accessible!')
      console.log(`   ${files.length} fichiers/dossiers trouvés`)
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }
}

testBucket().then(() => {
  console.log('\n✨ Tests terminés\n')
  process.exit(0)
}).catch(err => {
  console.error('💥 Erreur fatale:', err)
  process.exit(1)
})
