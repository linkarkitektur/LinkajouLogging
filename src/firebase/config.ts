import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import {
  getAuth,
  signInAnonymously,
} from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYg_ZmXeDnhEXklMGOfgJKv3gubFfKwhk",
  authDomain: "linkajou-abc36.firebaseapp.com",
  databaseURL: "https://linkajou-abc36-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "linkajou-abc36",
  storageBucket: "linkajou-abc36.firebasestorage.app",
  messagingSenderId: "474119946336",
  appId: "1:474119946336:web:f1183b849e32264fe8c305",
  measurementId: "G-6V1MK1FREQ"
}

let db: ReturnType<typeof getFirestore>

// Initialize Firebase
const initializeFirebase = async () => {
  try {
    const app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    const auth = getAuth(app)
    await signInAnonymously(auth)
  } catch (error) {
    console.error('Error initializing Firebase:', error)
    throw error
  }
}

// Initialize Firebase immediately
initializeFirebase()

export { db }