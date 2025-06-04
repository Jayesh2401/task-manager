import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore'
import { db, COLLECTIONS } from './firebase'

// History Service for managing task history and day-end reports
export class HistoryService {
  // Save day-end snapshot of tasks
  static async saveDayEndSnapshot(tasks, selectedDate, timeSpent, currentUserEmail) {
    try {
      const snapshot = {
        date: selectedDate,
        timeSpent: timeSpent, // Format: { hours: 0, minutes: 0, seconds: 0 }
        tasks: tasks.map(task => ({
          id: task.id,
          client: task.client,
          task: task.task,
          subTask: task.subTask,
          estimatedTime: task.estimatedTime,
          allottedTo: task.allottedTo,
          teamLeader: task.teamLeader,
          priority: task.priority,
          dueDate: task.dueDate,
          frequency: task.frequency,
          comment: task.comment,
          status: task.status,
          timeTaken: task.timeTaken
        })),
        createdBy: currentUserEmail.toLowerCase(),
        createdAt: serverTimestamp(),
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'Completed').length,
        inProgressTasks: tasks.filter(task => task.status === 'In Progress').length,
        todoTasks: tasks.filter(task => task.status === 'Todo').length
      }

      console.log('Saving snapshot to Firebase:', snapshot)
      const docRef = await addDoc(collection(db, COLLECTIONS.TASK_HISTORY), snapshot)
      console.log('Snapshot saved successfully with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error saving day-end snapshot:', error)
      throw error
    }
  }

  // Debug function to get all task history documents
  static async getAllTaskHistory(currentUserEmail) {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASK_HISTORY),
        where('createdBy', '==', currentUserEmail.toLowerCase())
      )

      const querySnapshot = await getDocs(q)
      const allDocs = []

      querySnapshot.forEach((doc) => {
        allDocs.push({
          id: doc.id,
          ...doc.data()
        })
      })

      console.log('All task history documents:', allDocs)
      return allDocs
    } catch (error) {
      console.error('Error fetching all task history:', error)
      throw error
    }
  }

  // Get day-end snapshots for a date range
  static async getDayEndReports(startDate, endDate, currentUserEmail) {
    try {
      console.log('Fetching reports for:', { startDate, endDate, currentUserEmail })

      // First, get all documents for the user
      const q = query(
        collection(db, COLLECTIONS.TASK_HISTORY),
        where('createdBy', '==', currentUserEmail.toLowerCase())
      )

      const querySnapshot = await getDocs(q)
      const reports = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Found document:', { id: doc.id, date: data.date, createdBy: data.createdBy })

        // Filter by date range on the client side
        if (data.date >= startDate && data.date <= endDate) {
          reports.push({
            id: doc.id,
            ...data
          })
        }
      })

      console.log('Filtered reports:', reports.length)

      // Sort by date ascending (old to new)
      reports.sort((a, b) => new Date(a.date) - new Date(b.date))

      return reports
    } catch (error) {
      console.error('Error fetching day-end reports:', error)
      throw error
    }
  }

  // Get specific day-end snapshot
  static async getDayEndSnapshot(snapshotId) {
    try {
      const docRef = doc(db, COLLECTIONS.TASK_HISTORY, snapshotId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      } else {
        throw new Error('Snapshot not found')
      }
    } catch (error) {
      console.error('Error fetching day-end snapshot:', error)
      throw error
    }
  }

  // Get all snapshots for a specific date
  static async getSnapshotsForDate(date, currentUserEmail) {
    try {
      console.log('Fetching snapshots for date:', { date, currentUserEmail })

      const q = query(
        collection(db, COLLECTIONS.TASK_HISTORY),
        where('createdBy', '==', currentUserEmail.toLowerCase()),
        where('date', '==', date)
      )

      const querySnapshot = await getDocs(q)
      const snapshots = []

      querySnapshot.forEach((doc) => {
        snapshots.push({
          id: doc.id,
          ...doc.data()
        })
      })

      // Sort by createdAt descending on client side
      snapshots.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt)
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt)
        return bTime - aTime
      })

      console.log('Found snapshots for date:', snapshots.length)
      return snapshots
    } catch (error) {
      console.error('Error fetching snapshots for date:', error)
      throw error
    }
  }

  // Format time for display
  static formatTimeSpent(timeSpent) {
    if (!timeSpent) return '00:00:00'
    
    const { hours = 0, minutes = 0, seconds = 0 } = timeSpent
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Parse time string to object
  static parseTimeString(timeString) {
    const parts = timeString.split(':')
    return {
      hours: parseInt(parts[0] || 0, 10),
      minutes: parseInt(parts[1] || 0, 10),
      seconds: parseInt(parts[2] || 0, 10)
    }
  }

  // Calculate total time spent across multiple snapshots
  static calculateTotalTime(snapshots) {
    let totalSeconds = 0
    
    snapshots.forEach(snapshot => {
      if (snapshot.timeSpent) {
        const { hours = 0, minutes = 0, seconds = 0 } = snapshot.timeSpent
        totalSeconds += (hours * 3600) + (minutes * 60) + seconds
      }
    })

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return { hours, minutes, seconds }
  }
}
