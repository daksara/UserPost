// One-time migration: strip the legacy `email` field from the publicly
// readable usernames index (privacy fix).
//
// WARNING: after this runs, legacy users can no longer sign in by username —
// they must use their email address. Announce that to users first.
//
// Runs with admin credentials (GOOGLE_APPLICATION_CREDENTIALS pointing at a
// service account JSON), e.g. via the "Migrate usernames index" GitHub Action.
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault() })
const db = getFirestore()

const snap = await db.collection('usernames').get()
const withEmail = snap.docs.filter((d) => d.get('email') !== undefined)
console.log(`${snap.size} username docs, ${withEmail.length} still contain an email`)

// Firestore batches are capped at 500 writes
for (let i = 0; i < withEmail.length; i += 500) {
  const batch = db.batch()
  for (const d of withEmail.slice(i, i + 500)) {
    batch.update(d.ref, { email: FieldValue.delete() })
  }
  await batch.commit()
  console.log(`cleaned ${Math.min(i + 500, withEmail.length)}/${withEmail.length}`)
}

console.log('done')
