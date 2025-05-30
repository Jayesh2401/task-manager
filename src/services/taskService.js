import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
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
  // Get tasks for specific user with real-time updates
  static subscribeToTasks(callback, currentUserEmail) {
    if (!currentUserEmail) {
      callback([])
      return () => {}
    }

    // Query for tasks where user is creator, allottedTo, or teamLeader
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const tasks = []
      querySnapshot.forEach((doc) => {
        const taskData = doc.data()
        const userEmail = currentUserEmail.toLowerCase()

        // Check if user has access to this task
        const hasAccess =
          taskData.createdBy === userEmail ||
          (taskData.sharedWith && taskData.sharedWith.includes(userEmail))

        if (hasAccess) {
          tasks.push({
            id: doc.id,
            ...taskData,
            createdAt: taskData.createdAt?.toDate(),
            updatedAt: taskData.updatedAt?.toDate(),
            dueDate: taskData.dueDate || null
          })
        }
      })
      callback(tasks)
    })
  }

  // Helper function to get user email by name
  static async getUserEmailByName(userName) {
    if (!userName) return null
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('name', '==', userName)
      )
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data().email
      }
      return null
    } catch (error) {
      console.error('Error getting user email:', error)
      return null
    }
  }

  // Add new task
  static async addTask(taskData, currentUserEmail) {
    try {
      // Build shared users list
      const sharedWith = [currentUserEmail.toLowerCase()]

      // Get emails for allottedTo and teamLeader users
      const allottedToEmail = await this.getUserEmailByName(taskData.allottedTo)
      const teamLeaderEmail = await this.getUserEmailByName(taskData.teamLeader)

      // Add allottedTo user email if different from creator
      if (allottedToEmail && allottedToEmail !== currentUserEmail) {
        sharedWith.push(allottedToEmail.toLowerCase())
      }

      // Add teamLeader user email if different from creator and allottedTo
      if (teamLeaderEmail &&
          teamLeaderEmail !== currentUserEmail &&
          !sharedWith.includes(teamLeaderEmail.toLowerCase())) {
        sharedWith.push(teamLeaderEmail.toLowerCase())
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
        ...taskData,
        createdBy: currentUserEmail.toLowerCase(),
        sharedWith: sharedWith,
        allottedToEmail: allottedToEmail,
        teamLeaderEmail: teamLeaderEmail,
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
  static async updateTask(taskId, updates, currentUserEmail) {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId)

      // If allottedTo or teamLeader is being updated, update sharedWith and email mappings
      if (updates.allottedTo !== undefined || updates.teamLeader !== undefined) {
        // Get current task data to rebuild sharedWith
        const taskDoc = await getDoc(taskRef)
        if (taskDoc.exists()) {
          const currentData = taskDoc.data()
          const sharedWith = [currentData.createdBy || currentUserEmail.toLowerCase()]

          // Get emails for new assignments
          const newAllottedToEmail = updates.allottedTo ?
            await this.getUserEmailByName(updates.allottedTo) :
            currentData.allottedToEmail
          const newTeamLeaderEmail = updates.teamLeader ?
            await this.getUserEmailByName(updates.teamLeader) :
            currentData.teamLeaderEmail

          // Add new allottedTo user
          if (newAllottedToEmail && !sharedWith.includes(newAllottedToEmail.toLowerCase())) {
            sharedWith.push(newAllottedToEmail.toLowerCase())
          }

          // Add new teamLeader user
          if (newTeamLeaderEmail && !sharedWith.includes(newTeamLeaderEmail.toLowerCase())) {
            sharedWith.push(newTeamLeaderEmail.toLowerCase())
          }

          updates.sharedWith = sharedWith
          updates.allottedToEmail = newAllottedToEmail
          updates.teamLeaderEmail = newTeamLeaderEmail
        }
      }

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
  // Get clients for specific user
  static subscribeToClients(callback, currentUserEmail) {
    if (!currentUserEmail) {
      callback([])
      return () => {}
    }

    const q = query(
      collection(db, COLLECTIONS.CLIENTS),
      where('createdBy', '==', currentUserEmail.toLowerCase())
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
      // Sort clients by name on the client side
      clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      console.log('Clients updated for user:', currentUserEmail, 'Count:', clients.length, 'Clients:', clients.map(c => c.name))
      callback(clients)
    })
  }

  // Add new client with validation
  static async addClient(clientData, currentUserEmail) {
    try {
      // Validate email format if provided
      if (clientData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(clientData.email)) {
          throw new Error('Invalid email format')
        }
      }

      // Validate phone number if provided (10 digits)
      if (clientData.phone) {
        const phoneRegex = /^\d{10}$/
        if (!phoneRegex.test(clientData.phone)) {
          throw new Error('Phone number must be exactly 10 digits')
        }
      }

      // Check if email already exists for this user (if email is provided)
      if (clientData.email) {
        const emailQuery = query(
          collection(db, COLLECTIONS.CLIENTS),
          where('email', '==', clientData.email.toLowerCase()),
          where('createdBy', '==', currentUserEmail.toLowerCase())
        )
        const emailSnapshot = await getDocs(emailQuery)
        if (!emailSnapshot.empty) {
          throw new Error('Client with this email already exists in your account')
        }
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
        name: clientData.name.trim(),
        email: clientData.email ? clientData.email.toLowerCase().trim() : '',
        phone: clientData.phone ? clientData.phone.trim() : '',
        createdBy: currentUserEmail.toLowerCase(),
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

  // Delete client
  static async deleteClient(clientId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CLIENTS, clientId))
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  }

  // Search clients by name or email
  static searchClients(clients, searchTerm) {
    if (!searchTerm) return clients
    const term = searchTerm.toLowerCase()
    return clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      (client.email && client.email.toLowerCase().includes(term))
    )
  }
}

// User Service
export class UserService {
  // Get users for specific user (user-specific team members)
  static subscribeToUsers(callback, currentUserEmail) {
    if (!currentUserEmail) {
      callback([])
      return () => {}
    }

    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('createdBy', '==', currentUserEmail.toLowerCase())
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
      // Sort users by name on the client side
      users.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      console.log('Users updated for user:', currentUserEmail, 'Count:', users.length, 'Users:', users.map(u => u.name))
      callback(users)
    })
  }

  // Add new user with validation
  static async addUser(userData, currentUserEmail) {
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

      // Check if email already exists for this user
      const emailQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', userData.email.toLowerCase()),
        where('createdBy', '==', currentUserEmail.toLowerCase())
      )
      const emailSnapshot = await getDocs(emailQuery)
      if (!emailSnapshot.empty) {
        throw new Error('User with this email already exists in your team')
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone.trim(),
        createdBy: currentUserEmail.toLowerCase(),
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
  // Get task templates for specific user
  static subscribeToTaskTemplates(callback, currentUserEmail) {
    if (!currentUserEmail) {
      callback([])
      return () => {}
    }

    const q = query(
      collection(db, COLLECTIONS.TASK_TEMPLATES),
      where('createdBy', '==', currentUserEmail.toLowerCase())
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
      // Sort templates by name on the client side
      templates.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      callback(templates)
    })
  }

  // Add new task template
  static async addTaskTemplate(templateData, currentUserEmail) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.TASK_TEMPLATES), {
        name: templateData.name.trim(),
        createdBy: currentUserEmail.toLowerCase(),
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
  // Get subtask templates for specific user
  static subscribeToSubTaskTemplates(callback, currentUserEmail) {
    if (!currentUserEmail) {
      callback([])
      return () => {}
    }

    const q = query(
      collection(db, COLLECTIONS.SUBTASK_TEMPLATES),
      where('createdBy', '==', currentUserEmail.toLowerCase())
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
      // Sort templates by name on the client side
      templates.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      callback(templates)
    })
  }

  // Add new subtask template
  static async addSubTaskTemplate(templateData, currentUserEmail) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.SUBTASK_TEMPLATES), {
        name: templateData.name.trim(),
        createdBy: currentUserEmail.toLowerCase(),
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
