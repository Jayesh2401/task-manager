import { useState, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import TaskTable from './components/TaskTable'
import ClientDashboard from './components/ClientDashboard'
import UserDashboard from './components/UserDashboard'
import AddUserModal from './components/modals/AddUserModal'
import AddClientModal from './components/modals/AddClientModal'
import AuthContainer from './components/auth/AuthContainer'

import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import { useDataManager } from './hooks/useDataManager'
import { useAuth } from './hooks/useAuth'
import "react-datepicker/dist/react-datepicker.css"
import './App.css'

function App() {
  const [selectedRows, setSelectedRows] = useState([])
  const [activeModal, setActiveModal] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null) // For dashboard filtering
  const { user, loading: authLoading, signOut } = useAuth()
  const dataManager = useDataManager(user)

  const addNewTask = useCallback(async () => {
    try {
      const newTask = {
        client: '',
        task: '',
        subTask: '',
        estimatedTime: 0,
        allottedTo: '',
        teamLeader: '',
        priority: 'Medium',
        dueDate: '',
        frequency: 'None',
        comment: '',
        status: 'Todo',
        timeTaken: 0
      }
      await dataManager.taskOperations.add(newTask)
    } catch (error) {
      console.error('Error adding new task:', error)
      alert('Failed to add task. Please try again.')
    }
  }, [dataManager])

  // Remove automatic task creation - users should manually add tasks

  // Handle dashboard filter clicks
  const handleDashboardFilter = useCallback((filterType) => {
    setActiveFilter(prevFilter => prevFilter === filterType ? null : filterType)
  }, [])

  const deleteSelectedTasks = useCallback(async () => {
    if (selectedRows.length > 0) {
      try {
        await dataManager.taskOperations.bulkDelete(selectedRows)
        setSelectedRows([])
      } catch (error) {
        console.error('Error deleting tasks:', error)
        alert('Failed to delete tasks. Please try again.')
      }
    }
  }, [selectedRows, dataManager])

  const saveTasks = useCallback(() => {
    // Tasks are automatically saved to Firebase
  }, [])

  const updateTask = useCallback(async (taskId, field, value) => {
    try {
      await dataManager.taskOperations.update(taskId, { [field]: value })
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task. Please try again.')
    }
  }, [dataManager])

  // Handle column actions from the fixed action row
  const handleColumnAction = useCallback((action, columnKey) => {
    if (action === 'add') {
      // Client uses simple modal (no password), allottedTo/teamLeader use user modal (with password)
      if (columnKey === 'client') {
        setActiveModal('addClientSimple')
      } else if (['allottedTo', 'teamLeader'].includes(columnKey)) {
        setActiveModal('addUser')
      } else if (columnKey === 'task') {
        setActiveModal('addTask')
      } else if (columnKey === 'subTask') {
        setActiveModal('addSubTask')
      }
    } else if (action === 'refresh') {
      // Refresh data for this column
      if (dataManager?.refresh) {
        if (['client', 'allottedTo', 'teamLeader'].includes(columnKey)) {
          dataManager.refresh('users')
        } else if (columnKey === 'task') {
          dataManager.refresh('taskTemplates')
        } else if (columnKey === 'subTask') {
          dataManager.refresh('subtaskTemplates')
        }
      }
    } else if (action === 'delete') {
      // Handle delete for selected items
      if (selectedRows.length > 0) {
        deleteSelectedTasks()
      } else {
        alert('Please select items to delete')
      }
    }
  }, [dataManager, selectedRows, deleteSelectedTasks])

  // Keyboard shortcuts - defined after all functions
  useKeyboardShortcuts({
    'ctrl+n': () => addNewTask(),
    'delete': () => deleteSelectedTasks(),
    'ctrl+s': () => saveTasks(),
  })

  // Show auth loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth container if user is not authenticated
  if (!user) {
    return <AuthContainer />
  }

  if (dataManager.isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Task Management System...</p>
        </div>
      </div>
    )
  }

  if (dataManager.error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error: {dataManager.error}</p>
            <p className="text-sm mt-2">Please refresh the page or try again later.</p>
          </div>
        </div>
      </div>
    )
  }

  // Route to different dashboards based on user type
  if (user?.userType === 'client') {
    return (
      <>
        <ClientDashboard
          clients={dataManager.data.clients}
          user={user}
          onSignOut={signOut}
          onAddClient={async (clientData) => {
            try {
              // For clients, just add to client collection without password/auth
              await dataManager.clientOperations.add(clientData)
            } catch (error) {
              console.error('Error adding client:', error)
              throw error
            }
          }}
        />
      </>
    )
  }

  if (user?.userType === 'user') {
    return (
      <UserDashboard
        tasks={dataManager.data.tasks}
        users={dataManager.data.users}
        user={user}
        onSignOut={signOut}
      />
    )
  }

  // Default admin dashboard
  return (
    <div className="min-h-screen bg-gray-100 app-container">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-5 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">{user?.displayName || 'Admin'}</h1>
              <span className="text-sm text-gray-500">{user?.email}</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Administrator
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span>30 Days</span>
              </button>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                title="Sign Out"
              >
                Sign Out
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Main Content */}
      <div className="w-full px-5 py-6">
        <Dashboard
          tasks={dataManager.data.tasks}
          activeFilter={activeFilter}
          onFilterClick={handleDashboardFilter}
        />

        <TaskTable
          tasks={dataManager.data.tasks}
          dataManager={dataManager}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          updateTask={updateTask}
          addNewTask={addNewTask}
          deleteSelectedTasks={deleteSelectedTasks}
          onColumnAction={handleColumnAction}
          activeFilter={activeFilter}
        />
      </div>

      {/* Modals */}
      {activeModal === 'addUser' && dataManager && (
        <AddUserModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onAdd={async (userData) => {
            try {
              await dataManager.userOperations.add(userData)
              setActiveModal(null)
            } catch (error) {
              console.error('Error adding user:', error)
              alert('Failed to add user. Please try again.')
            }
          }}
        />
      )}

      {/* Add Client Modal */}
      {activeModal === 'addClient' && (
        <AddClientModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onAdd={async (clientData) => {
            try {
              await dataManager.clientOperations.add(clientData)
              setActiveModal(null)
            } catch (error) {
              console.error('Error adding client:', error)
              alert('Failed to add client. Please try again.')
            }
          }}
        />
      )}

      {/* Add Client Simple Modal (for TaskTable column plus icon) */}
      {activeModal === 'addClientSimple' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Add Client
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const clientData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone')
              }

              if (!clientData.name || !clientData.email) {
                alert('Please fill in all required fields')
                return
              }

              dataManager.clientOperations.add(clientData)
                .then(() => setActiveModal(null))
                .catch(error => {
                  console.error('Error adding client:', error)
                  alert('Failed to add client. Please try again.')
                })
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter client name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Template Modal */}
      {activeModal === 'addTask' && dataManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Task Template</h3>
            <input
              type="text"
              placeholder="Enter task name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  dataManager.taskTemplateOperations.add({ name: e.target.value.trim() })
                  setActiveModal(null)
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SubTask Template Modal */}
      {activeModal === 'addSubTask' && dataManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add SubTask Template</h3>
            <input
              type="text"
              placeholder="Enter subtask name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  dataManager.subtaskTemplateOperations.add({ name: e.target.value.trim() })
                  setActiveModal(null)
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
