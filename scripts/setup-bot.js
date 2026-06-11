/**
 * Setup script — buat akun bot userpostbot di Firebase.
 *
 * Jalankan SATU KALI setelah Firebase project siap:
 *   node scripts/setup-bot.js
 *
 * Butuh: GOOGLE_APPLICATION_CREDENTIALS atau firebase-admin service account.
 * Pastikan package firebase-admin sudah di-install di root atau functions/.
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

// Ganti dengan path service account JSON dari Firebase Console
// Project Settings → Service Accounts → Generate new private key
const serviceAccount = require('./service-account.json')

initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

const BOT_EMAIL = 'bot@userpost.app'
const BOT_PASSWORD = 'GANTI_DENGAN_PASSWORD_KUAT'
const BOT_USERNAME = 'userpostbot'

async function main() {
  console.log('Membuat akun bot...')

  // 1. Buat Firebase Auth user
  let uid
  try {
    const user = await auth.createUser({
      email: BOT_EMAIL,
      password: BOT_PASSWORD,
      displayName: BOT_USERNAME,
      emailVerified: true,
    })
    uid = user.uid
    console.log(`Auth user dibuat: ${uid}`)
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const existing = await auth.getUserByEmail(BOT_EMAIL)
      uid = existing.uid
      console.log(`Auth user sudah ada: ${uid}`)
    } else {
      throw err
    }
  }

  // 2. Buat username index
  await db.collection('usernames').doc(BOT_USERNAME).set({ uid })
  console.log(`Username "${BOT_USERNAME}" diclaim`)

  // 3. Buat profile doc dengan badge bot
  await db.collection('profiles').doc(uid).set({
    username: BOT_USERNAME,
    created_at: Timestamp.now(),
    is_verified: false,
    badge_type: 'bot',
    bio: 'Automated market alerts — Whale, Dead Token, Accumulation.',
    photo_url: null,
  })
  console.log(`Profile bot dibuat dengan badge_type: "bot"`)

  // 4. Buat watchlist kosong
  await db.collection('bot_config').doc('watchlist').set({
    tokens: [],
  }, { merge: true })
  console.log('Dokumen bot_config/watchlist dibuat (kosong)')

  console.log('\n=== SELESAI ===')
  console.log(`Bot UID: ${uid}`)
  console.log('\nLangkah selanjutnya:')
  console.log(`1. Set BOT_UID di Firebase Functions params:`)
  console.log(`   firebase functions:secrets:set BOT_UID`)
  console.log(`   (masukkan: ${uid})`)
  console.log('2. Tambahkan token ke bot_config/watchlist di Firestore Console:')
  console.log('   tokens: [{ address: "0x...", chain: "ethereum" }]')
  console.log('3. Deploy functions:')
  console.log('   cd functions && npm install && npm run build')
  console.log('   cd .. && firebase deploy --only functions')
}

main().catch(console.error)
