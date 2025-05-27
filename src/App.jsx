import { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import TaskTable from './components/TaskTable'
import AddUserModal from './components/modals/AddUserModal'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import { useDataManager } from './hooks/useDataManager'
import './App.css'

function App() {
  const [selectedRows, setSelectedRows] = useState([])
  const [activeModal, setActiveModal] = useState(null)
  const dataManager = useDataManager()

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

  // Add sample data if none exists
  useEffect(() => {
    const addSampleDataIfNeeded = async () => {
      if (dataManager && !dataManager.isLoading && dataManager.data.tasks.length === 0) {
        try {
          // Add a sample task
          await addNewTask()
        } catch (error) {
          console.error('Error adding sample data:', error)
        }
      }
    }

    const timer = setTimeout(addSampleDataIfNeeded, 2000) // Wait 2 seconds for data to load
    return () => clearTimeout(timer)
  }, [dataManager, addNewTask])

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
      // For client, allottedTo, teamLeader - all use same user modal
      if (['client', 'allottedTo', 'teamLeader'].includes(columnKey)) {
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

  return (
    <div className="min-h-screen bg-gray-100 app-container">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-5 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Jayesh</h1>
              <span className="text-sm text-gray-500">Jayesh2401@gmail.com</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span>30 Days</span>
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
        <Dashboard tasks={dataManager.data.tasks} />

        <TaskTable
          tasks={dataManager.data.tasks}
          dataManager={dataManager}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          updateTask={updateTask}
          addNewTask={addNewTask}
          deleteSelectedTasks={deleteSelectedTasks}
          onColumnAction={handleColumnAction}
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
