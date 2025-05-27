import React, { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'

const EditableCell = ({ value, type, onChange, onClick }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text') {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  const handleClick = () => {
    if (['number', 'textarea'].includes(type)) {
      setIsEditing(true)
    }
  }

  const handleDoubleClick = () => {
    if (['text'].includes(type)) {
      setIsEditing(true)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && e.ctrlKey && type === 'textarea') {
      handleSave()
    }
  }

  const handleSave = () => {
    onChange(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleBlur = () => {
    handleSave()
  }

  const renderCell = () => {
    if (isEditing && ['text', 'number'].includes(type)) {
      return (
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
    }

    if (isEditing && type === 'textarea') {
      return (
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="Enter comment... (Ctrl+Enter to save)"
        />
      )
    }

    switch (type) {
      case 'dropdown':
      case 'frequency':
        return (
          <div
            onClick={onClick}
            className="w-full px-2 py-1 cursor-pointer hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
          >
            {value || 'Select...'}
          </div>
        )

      case 'date':
        return (
          <DatePicker
            selected={value ? new Date(value) : null}
            onChange={(date) => onChange(date ? date.toISOString().split('T')[0] : '')}
            dateFormat="yyyy-MM-dd"
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholderText="Select date"
          />
        )

      case 'text':
        return (
          <div
            onDoubleClick={handleDoubleClick}
            className="w-full px-2 py-1 cursor-text hover:bg-gray-50 rounded min-h-[24px]"
          >
            {value || ''}
          </div>
        )

      case 'number':
        return (
          <div
            onClick={handleClick}
            className="w-full px-2 py-1 cursor-pointer hover:bg-blue-50 rounded min-h-[24px] border border-transparent hover:border-blue-200"
            title="Click to edit"
          >
            {value || <span className="text-gray-400">0</span>}
          </div>
        )

      case 'textarea':
        return (
          <div
            onClick={handleClick}
            className="w-full px-2 py-1 cursor-pointer hover:bg-blue-50 rounded min-h-[60px] max-h-[100px] overflow-y-auto border border-transparent hover:border-blue-200"
            title="Click to edit comment"
          >
            {value ? (
              <div className="whitespace-pre-wrap break-words">
                {value}
              </div>
            ) : (
              <span className="text-gray-400">Click to add comment...</span>
            )}
          </div>
        )

      default:
        return (
          <div className="w-full px-2 py-1">
            {value || ''}
          </div>
        )
    }
  }

  return (
    <div className="relative">
      {renderCell()}
    </div>
  )
}

export default EditableCell
