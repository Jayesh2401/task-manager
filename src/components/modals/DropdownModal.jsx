import React, { useState, useRef, useEffect, useCallback } from 'react'
import { FaPlus } from 'react-icons/fa'

const DropdownModal = ({ options, position, onSelect, onClose, allowAddNew = false, fieldType = '' }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddNew, setShowAddNew] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const modalRef = useRef(null)
  const searchRef = useRef(null)

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchTerm])

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        const maxIndex = allowAddNew ? filteredOptions.length : filteredOptions.length - 1
        setSelectedIndex(prev =>
          prev < maxIndex ? prev + 1 : 0
        )
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        const maxIndex = allowAddNew ? filteredOptions.length : filteredOptions.length - 1
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : maxIndex
        )
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[selectedIndex])
        } else if (selectedIndex === filteredOptions.length && allowAddNew) {
          handleAddNewClick()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, selectedIndex, filteredOptions])

  const handleSelect = (option) => {
    onSelect(option)
  }

  const handleAddNew = () => {
    if (newItemName.trim()) {
      // For client field, send special signal to open client modal
      if (fieldType === 'client') {
        onSelect('ADD_NEW_CLIENT')
      } else if (['allottedTo', 'teamLeader'].includes(fieldType)) {
        onSelect('ADD_NEW_USER')
      } else if (fieldType === 'task') {
        onSelect('ADD_NEW_TASK')
      } else if (fieldType === 'subTask') {
        onSelect('ADD_NEW_SUBTASK')
      } else {
        // For other fields, just add the value directly
        onSelect(newItemName.trim())
      }
      setNewItemName('')
      setShowAddNew(false)
    }
  }

  const handleAddNewClick = useCallback(() => {
    // For client field, immediately open client modal
    if (fieldType === 'client') {
      onSelect('ADD_NEW_CLIENT')
    } else if (['allottedTo', 'teamLeader'].includes(fieldType)) {
      onSelect('ADD_NEW_USER')
    } else if (fieldType === 'task') {
      onSelect('ADD_NEW_TASK')
    } else if (fieldType === 'subTask') {
      onSelect('ADD_NEW_SUBTASK')
    } else {
      setShowAddNew(true)
    }
  }, [fieldType, onSelect])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && showAddNew) {
      handleAddNew()
    }
  }

  return (
    <div
      ref={modalRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-64"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: '300px'
      }}
    >
      {/* Search Input */}
      <div className="p-3 border-b border-gray-200">
        <input
          ref={searchRef}
          type="text"
          placeholder="Search or type to filter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Options List */}
      <div className="max-h-48 overflow-y-auto">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-blue-50'
              }`}
            >
              {option}
            </div>
          ))
        ) : (
          <div className="px-4 py-2 text-gray-500 text-sm">
            No options found
          </div>
        )}
      </div>

      {/* Add New Section */}
      {allowAddNew && (
        <div className="border-t border-gray-200">
          {!showAddNew ? (
            <div
              onClick={handleAddNewClick}
              className={`px-4 py-2 cursor-pointer flex items-center space-x-2 text-blue-600 ${
                selectedIndex === filteredOptions.length
                  ? 'bg-blue-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <FaPlus className="w-3 h-3" />
              <span className="text-sm">
                {fieldType === 'client' ? 'Add New Client' :
                 ['allottedTo', 'teamLeader'].includes(fieldType) ? 'Add New User' :
                 fieldType === 'task' ? 'Add New Task' :
                 fieldType === 'subTask' ? 'Add New SubTask' : 'Add New'}
              </span>
            </div>
          ) : (
            <div className="p-3">
              <input
                type="text"
                placeholder="Enter new item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddNew}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddNew(false)
                    setNewItemName('')
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DropdownModal
