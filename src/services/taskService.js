import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db, COLLECTIONS } from './firebase'

// Task Service
export class TaskService {
  // Get all tasks with real-time updates
  static subscribeToTasks(callback) {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const tasks = []
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          dueDate: doc.data().dueDate || null
        })
      })
      callback(tasks)
    })
  }

  // Add new task
  static async addTask(taskData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding task:', error)
      throw error
    }
  }

  // Update task
  static async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId)
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  // Delete task
  static async deleteTask(taskId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  // Bulk delete tasks
  static async deleteTasks(taskIds) {
    try {
      const batch = writeBatch(db)
      taskIds.forEach(taskId => {
        const taskRef = doc(db, COLLECTIONS.TASKS, taskId)
        batch.delete(taskRef)
      })
      await batch.commit()
    } catch (error) {
      console.error('Error bulk deleting tasks:', error)
      throw error
    }
  }

  // Get tasks by status
  static async getTasksByStatus(status) {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const tasks = []
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() })
      })
      return tasks
    } catch (error) {
      console.error('Error getting tasks by status:', error)
      throw error
    }
  }

  // Get tasks by client
  static async getTasksByClient(clientName) {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('client', '==', clientName),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const tasks = []
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() })
      })
      return tasks
    } catch (error) {
      console.error('Error getting tasks by client:', error)
      throw error
    }
  }
}

// Client Service
export class ClientService {
  // Get all clients
  static subscribeToClients(callback) {
    const q = query(
      collection(db, COLLECTIONS.CLIENTS),
      orderBy('name', 'asc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const clients = []
      querySnapshot.forEach((doc) => {
        clients.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })
      })
      callback(clients)
    })
  }

  // Add new client
  static async addClient(clientData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
        ...clientData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding client:', error)
      throw error
    }
  }

  // Update client
  static async updateClient(clientId, updates) {
    try {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientId)
      await updateDoc(clientRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }
}

// User Service
export class UserService {
  // Get all users
  static subscribeToUsers(callback) {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      orderBy('name', 'asc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const users = []
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })
      })
      callback(users)
    })
  }

  // Add new user with validation
  static async addUser(userData) {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format')
      }

      // Validate phone number (10 digits)
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(userData.phone)) {
        throw new Error('Phone number must be exactly 10 digits')
      }

      // Check if email already exists
      const emailQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', userData.email)
      )
      const emailSnapshot = await getDocs(emailQuery)
      if (!emailSnapshot.empty) {
        throw new Error('User with this email already exists')
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding user:', error)
      throw error
    }
  }

  // Update user
  static async updateUser(userId, updates) {
    try {
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(updates.email)) {
          throw new Error('Invalid email format')
        }
        updates.email = updates.email.toLowerCase().trim()
      }

      if (updates.phone) {
        const phoneRegex = /^\d{10}$/
        if (!phoneRegex.test(updates.phone)) {
          throw new Error('Phone number must be exactly 10 digits')
        }
      }

      const userRef = doc(db, COLLECTIONS.USERS, userId)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Delete user
  static async deleteUser(userId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId))
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Search users by name or email
  static searchUsers(users, searchTerm) {
    if (!searchTerm) return users
    const term = searchTerm.toLowerCase()
    return users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    )
  }
}

// Task Template Service
export class TaskTemplateService {
  // Get all task templates
  static subscribeToTaskTemplates(callback) {
    const q = query(
      collection(db, COLLECTIONS.TASK_TEMPLATES),
      orderBy('name', 'asc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const templates = []
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })
      })
      callback(templates)
    })
  }

  // Add new task template
  static async addTaskTemplate(templateData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.TASK_TEMPLATES), {
        name: templateData.name.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding task template:', error)
      throw error
    }
  }

  // Delete task template
  static async deleteTaskTemplate(templateId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.TASK_TEMPLATES, templateId))
    } catch (error) {
      console.error('Error deleting task template:', error)
      throw error
    }
  }

  // Search task templates
  static searchTaskTemplates(templates, searchTerm) {
    if (!searchTerm) return templates
    const term = searchTerm.toLowerCase()
    return templates.filter(template =>
      template.name.toLowerCase().includes(term)
    )
  }
}

// SubTask Template Service
export class SubTaskTemplateService {
  // Get all subtask templates
  static subscribeToSubTaskTemplates(callback) {
    const q = query(
      collection(db, COLLECTIONS.SUBTASK_TEMPLATES),
      orderBy('name', 'asc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const templates = []
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })
      })
      callback(templates)
    })
  }

  // Add new subtask template
  static async addSubTaskTemplate(templateData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.SUBTASK_TEMPLATES), {
        name: templateData.name.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding subtask template:', error)
      throw error
    }
  }

  // Delete subtask template
  static async deleteSubTaskTemplate(templateId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SUBTASK_TEMPLATES, templateId))
    } catch (error) {
      console.error('Error deleting subtask template:', error)
      throw error
    }
  }

  // Search subtask templates
  static searchSubTaskTemplates(templates, searchTerm) {
    if (!searchTerm) return templates
    const term = searchTerm.toLowerCase()
    return templates.filter(template =>
      template.name.toLowerCase().includes(term)
    )
  }
}

// Analytics Service
export class AnalyticsService {
  // Get task analytics
  static async getTaskAnalytics() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.TASKS))
      const tasks = []
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() })
      })

      const analytics = {
        total: tasks.length,
        byStatus: {},
        byPriority: {},
        byClient: {},
        dueToday: 0,
        overdue: 0,
        totalEstimatedTime: 0,
        totalTimeTaken: 0
      }

      const today = new Date().toISOString().split('T')[0]

      tasks.forEach(task => {
        // By status
        analytics.byStatus[task.status] = (analytics.byStatus[task.status] || 0) + 1

        // By priority
        analytics.byPriority[task.priority] = (analytics.byPriority[task.priority] || 0) + 1

        // By client
        analytics.byClient[task.client] = (analytics.byClient[task.client] || 0) + 1

        // Due today
        if (task.dueDate === today) {
          analytics.dueToday++
        }

        // Overdue
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed') {
          analytics.overdue++
        }

        // Time tracking
        analytics.totalEstimatedTime += task.estimatedTime || 0
        analytics.totalTimeTaken += task.timeTaken || 0
      })

      return analytics
    } catch (error) {
      console.error('Error getting analytics:', error)
      throw error
    }
  }
}
