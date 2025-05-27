import React, { useState, useRef, useEffect } from 'react'
import { FaSearch, FaPlus, FaUser, FaEnvelope, FaPhone, FaChevronDown } from 'react-icons/fa'

const SearchableDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Search or select...",
  type = "text", // "user", "task", "subtask", "client", "priority", "status"
  onAddNew,
  showAddButton = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Filter options based on search term
    if (searchTerm) {
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.email && option.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [searchTerm, options])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputClick = () => {
    setIsOpen(true)
    inputRef.current?.focus()
  }

  const handleOptionSelect = (option) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleAddNew = () => {
    setIsOpen(false)
    setSearchTerm('')
    if (onAddNew) {
      onAddNew()
    }
  }

  const getDisplayValue = () => {
    if (value) {
      const selectedOption = options.find(opt => opt.value === value)
      return selectedOption ? selectedOption.label : value
    }
    return ''
  }

  const renderUserOption = (option) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <FaUser className="w-4 h-4 text-blue-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {option.label}
        </div>
        {option.email && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <FaEnvelope className="w-3 h-3" />
            <span className="truncate">{option.email}</span>
          </div>
        )}
        {option.phone && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <FaPhone className="w-3 h-3" />
            <span>{option.phone}</span>
          </div>
        )}
      </div>
    </div>
  )

  const renderRegularOption = (option) => (
    <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900">
      {option.label}
    </div>
  )

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div 
        className="relative cursor-pointer"
        onClick={handleInputClick}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : getDisplayValue()}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          readOnly={!isOpen}
        />
        <FaChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Search Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id || index}
                  onClick={() => handleOptionSelect(option)}
                >
                  {type === 'user' ? renderUserOption(option) : renderRegularOption(option)}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {searchTerm ? `No results found for "${searchTerm}"` : 'No options available'}
              </div>
            )}
          </div>

          {/* Add New Button */}
          {showAddButton && onAddNew && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200">
              <button
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add New {type === 'user' ? 'User' : type === 'task' ? 'Task' : type === 'subtask' ? 'SubTask' : 'Item'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableDropdown
