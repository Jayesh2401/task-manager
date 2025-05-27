import { useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore'
import { db } from '../services/firebase'

export const useFirebase = (collectionName) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items = []
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() })
        })
        setData(items)
        setLoading(false)
      },
      (error) => {
        setError(error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [collectionName])

  const addItem = async (item) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      setError(error)
      throw error
    }
  }

  const updateItem = async (id, updates) => {
    try {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      setError(error)
      throw error
    }
  }

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (error) {
      setError(error)
      throw error
    }
  }

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  }
}
