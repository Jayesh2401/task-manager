import React, { useState } from 'react'
import { FaPlus, FaSync, FaTrash, FaUser, FaTasks, FaList, FaUserTie, FaFlag, FaCheckCircle } from 'react-icons/fa'
import AddUserModal from './modals/AddUserModal'
import AddTaskTemplateModal from './modals/AddTaskTemplateModal'
import AddSubTaskTemplateModal from './modals/AddSubTaskTemplateModal'

const ActionBar = ({ 
  dataManager, 
  selectedRows, 
  onClearSelection,
  onBulkDelete 
}) => {
  const [activeModal, setActiveModal] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState({})

  const actionItems = [
    {
      id: 'user',
      label: 'User',
      icon: FaUser,
      color: 'bg-blue-500 hover:bg-blue-600',
      modal: 'addUser'
    },
    {
      id: 'task',
      label: 'Task',
      icon: FaTasks,
      color: 'bg-green-500 hover:bg-green-600',
      modal: 'addTask'
    },
    {
      id: 'subtask',
      label: 'SubTask',
      icon: FaList,
      color: 'bg-purple-500 hover:bg-purple-600',
      modal: 'addSubTask'
    },
    {
      id: 'client',
      label: 'Client',
      icon: FaUserTie,
      color: 'bg-orange-500 hover:bg-orange-600',
      modal: 'addClient'
    },
    {
      id: 'priority',
      label: 'Priority',
      icon: FaFlag,
      color: 'bg-red-500 hover:bg-red-600',
      action: 'managePriority'
    },
    {
      id: 'status',
      label: 'Status',
      icon: FaCheckCircle,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: 'manageStatus'
    }
  ]

  const handleAdd = (type) => {
    setActiveModal(type)
  }

  const handleRefresh = async (type) => {
    setIsRefreshing(prev => ({ ...prev, [type]: true }))
    try {
      await dataManager.refresh(type)
    } catch (error) {
      console.error(`Error refreshing ${type}:`, error)
    } finally {
      setTimeout(() => {
        setIsRefreshing(prev => ({ ...prev, [type]: false }))
      }, 1000)
    }
  }

  const handleDelete = async (type) => {
    if (selectedRows.length === 0) {
      alert('Please select items to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedRows.length} selected item(s)?`)) {
      return
    }

    try {
      await onBulkDelete(selectedRows)
      onClearSelection()
    } catch (error) {
      console.error('Error deleting items:', error)
      alert('Error deleting items. Please try again.')
    }
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
          
          {selectedRows.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedRows.length} item(s) selected
            </div>
          )}
        </div>

        {/* Action Grid */}
        <div className="mt-4 grid grid-cols-6 gap-4">
          {actionItems.map((item) => (
            <div key={item.id} className="space-y-2">
              {/* Column Header */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{item.label}</h3>
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-1">
                  {/* Add Button */}
                  <button
                    onClick={() => handleAdd(item.modal || item.action)}
                    className={`${item.color} text-white p-2 rounded-md text-xs font-medium flex items-center justify-center space-x-1 transition-colors`}
                    title={`Add ${item.label}`}
                  >
                    <FaPlus className="w-3 h-3" />
                    <span>Add</span>
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={() => handleRefresh(item.id)}
                    disabled={isRefreshing[item.id]}
                    className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white p-2 rounded-md text-xs font-medium flex items-center justify-center space-x-1 transition-colors"
                    title={`Refresh ${item.label}`}
                  >
                    <FaSync className={`w-3 h-3 ${isRefreshing[item.id] ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={selectedRows.length === 0}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white p-2 rounded-md text-xs font-medium flex items-center justify-center space-x-1 transition-colors"
                    title={`Delete Selected ${item.label}`}
                  >
                    <FaTrash className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Info */}
        <div className="mt-4 grid grid-cols-6 gap-4 text-center">
          <div className="text-xs text-gray-500">
            {dataManager.data.users.length} users
          </div>
          <div className="text-xs text-gray-500">
            {dataManager.data.taskTemplates.length} tasks
          </div>
          <div className="text-xs text-gray-500">
            {dataManager.data.subtaskTemplates.length} subtasks
          </div>
          <div className="text-xs text-gray-500">
            {dataManager.data.clients.length} clients
          </div>
          <div className="text-xs text-gray-500">
            4 priorities
          </div>
          <div className="text-xs text-gray-500">
            4 statuses
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'addUser' && (
        <AddUserModal
          isOpen={true}
          onClose={closeModal}
          onAdd={dataManager.userOperations.add}
        />
      )}

      {activeModal === 'addTask' && (
        <AddTaskTemplateModal
          isOpen={true}
          onClose={closeModal}
          onAdd={dataManager.taskTemplateOperations.add}
        />
      )}

      {activeModal === 'addSubTask' && (
        <AddSubTaskTemplateModal
          isOpen={true}
          onClose={closeModal}
          onAdd={dataManager.subtaskTemplateOperations.add}
        />
      )}

      {activeModal === 'addClient' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Client</h3>
            <p className="text-gray-600 mb-4">Client management coming soon...</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'managePriority' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Manage Priorities</h3>
            <div className="space-y-2 mb-4">
              {dataManager.getDropdownData('priority').map(priority => (
                <div key={priority.id} className="flex items-center justify-between p-2 border rounded">
                  <span>{priority.label}</span>
                  <span className="text-sm text-gray-500">System</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'manageStatus' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Manage Status</h3>
            <div className="space-y-2 mb-4">
              {dataManager.getDropdownData('status').map(status => (
                <div key={status.id} className="flex items-center justify-between p-2 border rounded">
                  <span>{status.label}</span>
                  <span className="text-sm text-gray-500">System</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ActionBar
