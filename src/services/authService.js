import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { auth, db, COLLECTIONS } from './firebase'

export class AuthService {
  // Sign up with email and password
  static async signUp(email, password, displayName) {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update user profile with display name
      await updateProfile(user, {
        displayName: displayName
      })

      // Create user document in Firestore
      await setDoc(doc(db, COLLECTIONS.AUTH_USERS, user.uid), {
        name: displayName,
        email: email.toLowerCase(),
        uid: user.uid,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        },
        message: 'Account created successfully! You can now sign in.'
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      }
    }
  }

  // Sign in with email and password
  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.AUTH_USERS, user.uid))
      let userData = null

      if (userDoc.exists()) {
        userData = userDoc.data()
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          userType: userData?.userType || 'admin', // Default to admin for regular signups
          userData: userData
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      }
    }
  }

  // Sign out
  static async signOut() {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return {
        success: false,
        error: 'Failed to sign out. Please try again.'
      }
    }
  }

  // Send password reset email
  static async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox.'
      }
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      }
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, COLLECTIONS.AUTH_USERS, user.uid))
        let userData = null

        if (userDoc.exists()) {
          userData = userDoc.data()
        }

        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          userType: userData?.userType || 'admin', // Default to admin for regular signups
          userData: userData
        })
      } else {
        callback(null)
      }
    })
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser
  }

  // Create user credentials (for Allotted To/Team Leader)
  static async createUserCredentials(userData) {
    try {
      // Generate a unique ID for the user credentials
      const credentialId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store user credentials in Firestore (they can create account later)
      await setDoc(doc(db, COLLECTIONS.AUTH_USERS, credentialId), {
        name: userData.name,
        email: userData.email.toLowerCase(),
        phone: userData.phone || '',
        password: userData.password, // In production, this should be hashed
        userType: 'user', // Mark as user (not client)
        emailVerified: true,
        accountCreated: false, // Flag to indicate if Firebase Auth account is created
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      })

      return {
        success: true,
        user: {
          id: credentialId,
          email: userData.email,
          displayName: userData.name,
          emailVerified: true
        },
        message: 'User credentials stored successfully! They can now sign in.'
      }
    } catch (error) {
      console.error('Create user credentials error:', error)
      return {
        success: false,
        error: 'Failed to store user credentials. Please try again.'
      }
    }
  }

  // Create client credentials (separate from users)
  static async createClientCredentials(clientData) {
    try {
      // Generate a unique ID for the client credentials
      const credentialId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store client credentials in Firestore (they can create account later)
      await setDoc(doc(db, COLLECTIONS.AUTH_USERS, credentialId), {
        name: clientData.name,
        email: clientData.email.toLowerCase(),
        password: clientData.password, // In production, this should be hashed
        userType: 'client', // Mark as client (not user)
        emailVerified: true,
        accountCreated: false, // Flag to indicate if Firebase Auth account is created
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      })

      return {
        success: true,
        user: {
          id: credentialId,
          email: clientData.email,
          displayName: clientData.name,
          emailVerified: true
        },
        message: 'Client credentials stored successfully! They can now sign in.'
      }
    } catch (error) {
      console.error('Create client credentials error:', error)
      return {
        success: false,
        error: 'Failed to store client credentials. Please try again.'
      }
    }
  }

  // Sign in with stored credentials (check Firestore first, then create Firebase account if needed)
  static async signInWithStoredCredentials(email, password) {
    try {
      // First try normal Firebase Auth sign in
      try {
        const result = await this.signIn(email, password)
        if (result.success) {
          return result
        }
      } catch (authError) {
        // If Firebase Auth fails, check stored credentials
      }

      // Check stored credentials in Firestore
      const credentialsQuery = query(
        collection(db, COLLECTIONS.AUTH_USERS),
        where('email', '==', email.toLowerCase()),
        where('password', '==', password),
        where('accountCreated', '==', false)
      )

      const credentialsSnapshot = await getDocs(credentialsQuery)

      if (!credentialsSnapshot.empty) {
        const credentialDoc = credentialsSnapshot.docs[0]
        const credentialData = credentialDoc.data()

        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Update user profile
        await updateProfile(user, {
          displayName: credentialData.name
        })

        // Update the stored credentials to mark account as created
        await updateDoc(doc(db, COLLECTIONS.AUTH_USERS, credentialDoc.id), {
          uid: user.uid,
          accountCreated: true,
          updatedAt: new Date()
        })

        return {
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: true,
            userType: credentialData.userType, // 'user' or 'client'
            userData: credentialData
          }
        }
      }

      // If no stored credentials found, return error
      return {
        success: false,
        error: 'Invalid email or password. Please try again.'
      }
    } catch (error) {
      console.error('Sign in with stored credentials error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      }
    }
  }

  // Resend email verification (keeping for compatibility)
  static async resendEmailVerification() {
    return {
      success: true,
      message: 'Email verification is not required for this application.'
    }
  }

  // Helper method to get user-friendly error messages
  static getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-disabled':
        return 'This account has been disabled.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.'
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.'
      default:
        return 'An error occurred. Please try again.'
    }
  }
}
