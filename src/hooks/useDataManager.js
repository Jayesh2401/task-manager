import { useState, useEffect, useCallback } from 'react'
import {
  TaskService,
  ClientService,
  UserService,
  TaskTemplateService,
  SubTaskTemplateService
} from '../services/taskService'
import { AuthService } from '../services/authService'

// Central data management hook to minimize database calls
export const useDataManager = (currentUser) => {
  // State for all data
  const [data, setData] = useState({
    tasks: [],
    clients: [],
    users: [],
    taskTemplates: [],
    subtaskTemplates: []
  })

  const [loading, setLoading] = useState({
    tasks: true,
    clients: true,
    users: true,
    taskTemplates: true,
    subtaskTemplates: true
  })

  const [error, setError] = useState(null)

  // Unsubscribe functions
  const [unsubscribers, setUnsubscribers] = useState({})

  // Initialize all data subscriptions
  useEffect(() => {
    const initializeData = async () => {
      try {
        const newUnsubscribers = {}

        // Only initialize if user is available
        if (!currentUser?.email) {
          setLoading({
            tasks: false,
            clients: false,
            users: false,
            taskTemplates: false,
            subtaskTemplates: false
          })
          return
        }

        // Subscribe to tasks (user-specific)
        newUnsubscribers.tasks = TaskService.subscribeToTasks((tasksData) => {
          setData(prev => ({ ...prev, tasks: tasksData }))
          setLoading(prev => ({ ...prev, tasks: false }))
        }, currentUser.email)

        // Subscribe to clients (user-specific)
        newUnsubscribers.clients = ClientService.subscribeToClients((clientsData) => {
          setData(prev => ({ ...prev, clients: clientsData }))
          setLoading(prev => ({ ...prev, clients: false }))
        }, currentUser.email)

        // Subscribe to users (user-specific team members)
        newUnsubscribers.users = UserService.subscribeToUsers((usersData) => {
          setData(prev => ({ ...prev, users: usersData }))
          setLoading(prev => ({ ...prev, users: false }))
        }, currentUser.email)

        // Subscribe to task templates (user-specific)
        newUnsubscribers.taskTemplates = TaskTemplateService.subscribeToTaskTemplates((templatesData) => {
          setData(prev => ({ ...prev, taskTemplates: templatesData }))
          setLoading(prev => ({ ...prev, taskTemplates: false }))
        }, currentUser.email)

        // Subscribe to subtask templates (user-specific)
        newUnsubscribers.subtaskTemplates = SubTaskTemplateService.subscribeToSubTaskTemplates((templatesData) => {
          setData(prev => ({ ...prev, subtaskTemplates: templatesData }))
          setLoading(prev => ({ ...prev, subtaskTemplates: false }))
        }, currentUser.email)

        setUnsubscribers(newUnsubscribers)

      } catch (err) {
        console.error('Error initializing data:', err)
        setError(err.message)
        setLoading({
          tasks: false,
          clients: false,
          users: false,
          taskTemplates: false,
          subtaskTemplates: false
        })
      }
    }

    initializeData()

    // Cleanup subscriptions
    return () => {
      Object.values(unsubscribers).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe()
      })
    }
  }, [currentUser?.email])

  // Task operations
  const taskOperations = {
    add: useCallback(async (taskData) => {
      return await TaskService.addTask(taskData, currentUser?.email)
    }, [currentUser?.email]),

    update: useCallback(async (taskId, updates) => {
      return await TaskService.updateTask(taskId, updates, currentUser?.email)
    }, [currentUser?.email]),

    delete: useCallback(async (taskId) => {
      return await TaskService.deleteTask(taskId)
    }, []),

    bulkDelete: useCallback(async (taskIds) => {
      return await TaskService.deleteTasks(taskIds)
    }, [])
  }

  // User operations
  const userOperations = {
    add: useCallback(async (userData) => {
      // If password is provided, store credentials for later account creation
      if (userData.password) {
        // Store user credentials first
        const authResult = await AuthService.createUserCredentials(userData)
        if (!authResult.success) {
          throw new Error(authResult.error)
        }

        // Then add to users collection for task management
        const userForTasks = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone
        }
        return await UserService.addUser(userForTasks, currentUser?.email)
      } else {
        // Just add to users collection (for task management only)
        return await UserService.addUser(userData, currentUser?.email)
      }
    }, [currentUser?.email]),

    update: useCallback(async (userId, updates) => {
      return await UserService.updateUser(userId, updates)
    }, []),

    delete: useCallback(async (userId) => {
      return await UserService.deleteUser(userId)
    }, []),

    search: useCallback((searchTerm) => {
      return UserService.searchUsers(data.users, searchTerm)
    }, [data.users])
  }

  // Client operations
  const clientOperations = {
    add: useCallback(async (clientData) => {
      // If password is provided, store credentials for later account creation
      if (clientData.password) {
        // Store client credentials first (separate from users)
        const authResult = await AuthService.createClientCredentials(clientData)
        if (!authResult.success) {
          throw new Error(authResult.error)
        }

        // Then add to clients collection
        const clientForTasks = {
          name: clientData.name,
          email: clientData.email
        }
        return await ClientService.addClient(clientForTasks, currentUser?.email)
      } else {
        // Just add to clients collection
        return await ClientService.addClient(clientData, currentUser?.email)
      }
    }, [currentUser?.email]),

    update: useCallback(async (clientId, updates) => {
      return await ClientService.updateClient(clientId, updates)
    }, [])
  }

  // Task template operations
  const taskTemplateOperations = {
    add: useCallback(async (templateData) => {
      return await TaskTemplateService.addTaskTemplate(templateData, currentUser?.email)
    }, [currentUser?.email]),

    delete: useCallback(async (templateId) => {
      return await TaskTemplateService.deleteTaskTemplate(templateId)
    }, []),

    search: useCallback((searchTerm) => {
      return TaskTemplateService.searchTaskTemplates(data.taskTemplates, searchTerm)
    }, [data.taskTemplates])
  }

  // Subtask template operations
  const subtaskTemplateOperations = {
    add: useCallback(async (templateData) => {
      return await SubTaskTemplateService.addSubTaskTemplate(templateData, currentUser?.email)
    }, [currentUser?.email]),

    delete: useCallback(async (templateId) => {
      return await SubTaskTemplateService.deleteSubTaskTemplate(templateId)
    }, []),

    search: useCallback((searchTerm) => {
      return SubTaskTemplateService.searchSubTaskTemplates(data.subtaskTemplates, searchTerm)
    }, [data.subtaskTemplates])
  }

  // Refresh specific data
  const refresh = useCallback((dataType) => {
    if (unsubscribers[dataType]) {
      setLoading(prev => ({ ...prev, [dataType]: true }))
      // The subscription will automatically update the data
    }
  }, [unsubscribers])

  // Get loading state
  const isLoading = Object.values(loading).some(Boolean)

  // Get formatted data for dropdowns
  const getDropdownData = useCallback((type) => {
    switch (type) {
      case 'users':
        return data.users.map(user => ({
          id: user.id,
          label: user.name,
          value: user.name,
          email: user.email,
          phone: user.phone
        }))

      case 'clients':
        return data.clients.map(client => ({
          id: client.id,
          label: client.name,
          value: client.name
        }))

      case 'taskTemplates':
        return data.taskTemplates.map(template => ({
          id: template.id,
          label: template.name,
          value: template.name
        }))

      case 'subtaskTemplates':
        return data.subtaskTemplates.map(template => ({
          id: template.id,
          label: template.name,
          value: template.name
        }))

      case 'priority':
        return [
          { id: 'low', label: 'Low', value: 'Low' },
          { id: 'medium', label: 'Medium', value: 'Medium' },
          { id: 'high', label: 'High', value: 'High' },
          { id: 'critical', label: 'Critical', value: 'Critical' }
        ]

      case 'status':
        return [
          { id: 'todo', label: 'Todo', value: 'Todo' },
          { id: 'inprogress', label: 'In Progress', value: 'In Progress' },
          { id: 'completed', label: 'Completed', value: 'Completed' },
          { id: 'archived', label: 'Archived', value: 'Archived' }
        ]

      default:
        return []
    }
  }, [data])

  return {
    // Data
    data,
    loading,
    error,
    isLoading,

    // Operations
    taskOperations,
    userOperations,
    clientOperations,
    taskTemplateOperations,
    subtaskTemplateOperations,

    // Utilities
    refresh,
    getDropdownData
  }
}
