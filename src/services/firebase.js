import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCZZk7eZIza2pD4D3Tt-QMZWmUGZGmnV08",
  authDomain: "retro-app-2025.firebaseapp.com",
  projectId: "retro-app-2025",
  storageBucket: "retro-app-2025.firebasestorage.app",
  messagingSenderId: "358273281250",
  appId: "1:358273281250:web:1e07cd7bdb5817dbae42bb",
  // measurementId: "G-G90WXSYPB9"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)

// Connect to emulators in development (DISABLED - using production Firebase)
// if (import.meta.env.DEV) {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080)
//     connectAuthEmulator(auth, 'http://localhost:9099')
//   } catch (error) {
//     console.log('Emulators already connected or not available')
//   }
// }

// Collection names
export const COLLECTIONS = {
  TASKS: 'tasks',
  CLIENTS: 'clients',
  USERS: 'users',
  PROJECTS: 'projects',
  TASK_TEMPLATES: 'taskTemplates',
  SUBTASK_TEMPLATES: 'subtaskTemplates',
  AUTH_USERS: 'authUsers' // For authenticated user profiles
}

export default app
