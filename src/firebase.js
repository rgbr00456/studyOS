// ─── Firebase Configuration ───────────────────────────────────────────────────
// Credentials are loaded from .env (never commit .env to git)
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isConfigured = Object.values(firebaseConfig).every(v => v && v !== 'cole_aqui')

export const app      = isConfigured ? initializeApp(firebaseConfig) : null
export const auth     = isConfigured ? getAuth(app) : null
export const db       = isConfigured ? getFirestore(app) : null
export const gProvider = isConfigured ? new GoogleAuthProvider() : null

if (gProvider) {
  gProvider.setCustomParameters({ prompt: 'select_account' })
}
