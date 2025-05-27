import { useState, useEffect, useCallback } from 'react'
import { 
  TaskService, 
  ClientService, 
  UserService, 
  TaskTemplateService, 
  SubTaskTemplateService 
} from '../services/taskService'

// Central data management hook to minimize database calls
export const useDataManager = () => {
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

        // Subscribe to tasks
        newUnsubscribers.tasks = TaskService.subscribeToTasks((tasksData) => {
          setData(prev => ({ ...prev, tasks: tasksData }))
          setLoading(prev => ({ ...prev, tasks: false }))
        })

        // Subscribe to clients
        newUnsubscribers.clients = ClientService.subscribeToClients((clientsData) => {
          setData(prev => ({ ...prev, clients: clientsData }))
          setLoading(prev => ({ ...prev, clients: false }))
        })

        // Subscribe to users
        newUnsubscribers.users = UserService.subscribeToUsers((usersData) => {
          setData(prev => ({ ...prev, users: usersData }))
          setLoading(prev => ({ ...prev, users: false }))
        })

        // Subscribe to task templates
        newUnsubscribers.taskTemplates = TaskTemplateService.subscribeToTaskTemplates((templatesData) => {
          setData(prev => ({ ...prev, taskTemplates: templatesData }))
          setLoading(prev => ({ ...prev, taskTemplates: false }))
        })

        // Subscribe to subtask templates
        newUnsubscribers.subtaskTemplates = SubTaskTemplateService.subscribeToSubTaskTemplates((templatesData) => {
          setData(prev => ({ ...prev, subtaskTemplates: templatesData }))
          setLoading(prev => ({ ...prev, subtaskTemplates: false }))
        })

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
  }, [])

  // Task operations
  const taskOperations = {
    add: useCallback(async (taskData) => {
      return await TaskService.addTask(taskData)
    }, []),

    update: useCallback(async (taskId, updates) => {
      return await TaskService.updateTask(taskId, updates)
    }, []),

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
      return await UserService.addUser(userData)
    }, []),

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
      return await ClientService.addClient(clientData)
    }, []),

    update: useCallback(async (clientId, updates) => {
      return await ClientService.updateClient(clientId, updates)
    }, [])
  }

  // Task template operations
  const taskTemplateOperations = {
    add: useCallback(async (templateData) => {
      return await TaskTemplateService.addTaskTemplate(templateData)
    }, []),

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
      return await SubTaskTemplateService.addSubTaskTemplate(templateData)
    }, []),

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
