#!/usr/bin/env node

/**
 * Script pour déployer la fonction SQL corrigée get_product_unavailabilities
 * Cette fonction utilise maintenant rental_items et rental_reservations
 * au lieu des anciennes tables reservation_items et reservations
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function deployFunction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes')
    console.error('   Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Lire le fichier SQL
  const sqlPath = path.join(__dirname, 'supabase/migrations/get_product_unavailabilities.sql')
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')

  console.log('🚀 Déploiement de la fonction SQL get_product_unavailabilities...')
  console.log('📝 Contenu SQL:')
  console.log(sqlContent)
  console.log('\n' + '='.repeat(60) + '\n')

  try {
    // Exécuter le SQL
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent }).catch(async () => {
      // Si exec n'existe pas, utiliser une approche directe
      const { data, error } = await supabase.from('_sql').select('*').limit(0)

      // Méthode alternative: utiliser l'API REST directement
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: sqlContent })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return { data: await response.json(), error: null }
    })

    if (error) {
      console.error('❌ Erreur lors du déploiement:', error)

      // Suggestion: utiliser psql directement
      console.log('\n💡 Solution alternative:')
      console.log('   Utilisez psql pour exécuter la migration:')
      console.log(`   psql "$DATABASE_URL" -f supabase/migrations/get_product_unavailabilities.sql`)
      console.log('\n   Ou via le SQL Editor de Supabase Dashboard:')
      console.log('   1. Ouvrez https://supabase.com/dashboard/project/_/sql')
      console.log('   2. Copiez-collez le contenu du fichier get_product_unavailabilities.sql')
      console.log('   3. Cliquez sur "Run"')

      process.exit(1)
    }

    console.log('✅ Fonction déployée avec succès!')
    console.log('   La fonction get_product_unavailabilities utilise maintenant:')
    console.log('   - rental_items (au lieu de reservation_items)')
    console.log('   - rental_reservations (au lieu de reservations)')

  } catch (err) {
    console.error('❌ Exception:', err.message)

    console.log('\n💡 Solution manuelle recommandée:')
    console.log('   Ouvrez le SQL Editor de Supabase et exécutez:')
    console.log(`   ${sqlPath}`)
    console.log('\n   Ou copiez-collez ce SQL:')
    console.log('\n' + '─'.repeat(60))
    console.log(sqlContent)
    console.log('─'.repeat(60) + '\n')

    process.exit(1)
  }
}

deployFunction()
