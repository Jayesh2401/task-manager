import React, { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'

const EditableCell = ({ value, type, onChange, onClick }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const inputRef = useRef(null)
  const datePickerRef = useRef(null)

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

  const handleClick = (e) => {
    if (['number', 'textarea'].includes(type)) {
      setIsEditing(true)
    }
    // Don't stop propagation - let the event bubble up to parent td
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

  // Helper function to format number values
  const formatNumberValue = (value) => {
    if (!value || value === '' || value === null || value === undefined) return ''

    const numStr = value.toString().trim()

    // Handle empty or invalid strings
    if (numStr === '' || numStr === '0' || numStr === '00' || numStr === '000') {
      return '0'
    }

    // If it's a decimal number (contains a dot)
    if (numStr.includes('.')) {
      const num = parseFloat(numStr)
      if (isNaN(num)) return ''

      // Remove trailing zeros after decimal point
      return num.toString()
    }

    // If it's a whole number, remove leading zeros
    const num = parseInt(numStr, 10)
    if (isNaN(num)) return ''

    return num.toString()
  }

  const handleSave = () => {
    // Format number values to remove unnecessary leading zeros
    if (type === 'number') {
      const formattedValue = formatNumberValue(editValue)
      console.log('Number formatting:', { original: editValue, formatted: formattedValue })
      onChange(formattedValue)
    } else {
      onChange(editValue)
    }
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
        return (
          <div
            onClick={(e) => {
              if (onClick) onClick(e)
              // Let event bubble up to parent td for focus handling
            }}
            className="w-full px-2 py-1 cursor-pointer hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
            data-editable="true"
          >
            {value || 'Select...'}
          </div>
        )

      case 'frequency':
        // Format frequency display to show user-friendly text
        const formatFrequencyDisplay = (freq) => {
          if (!freq || freq === 'None') return 'None'

          if (freq.includes('|')) {
            const parts = freq.split('|')
            const frequency = parts[0]
            const startDate = parts[1] ? new Date(parts[1]).toLocaleDateString('en-GB') : ''
            const endDate = parts[2] ? new Date(parts[2]).toLocaleDateString('en-GB') : ''

            let display = frequency
            if (startDate || endDate) {
              display += ' ('
              if (startDate) display += `from ${startDate}`
              if (startDate && endDate) display += ' '
              if (endDate) display += `to ${endDate}`
              display += ')'
            }
            return display
          }

          return freq
        }

        return (
          <div
            onClick={(e) => {
              if (onClick) onClick(e)
              // Let event bubble up to parent td for focus handling
            }}
            className="w-full px-2 py-1 cursor-pointer hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
            title={value ? formatFrequencyDisplay(value) : 'Click to set frequency'}
            data-editable="true"
          >
            {formatFrequencyDisplay(value) || 'Select...'}
          </div>
        )

      case 'date':
        return (
          <div className="w-full" onClick={(e) => e.stopPropagation()} data-editable="true">
            <DatePicker
              ref={datePickerRef}
              selected={value ? new Date(value) : null}
              onChange={(date) => {
                onChange(date ? date.toISOString().split('T')[0] : '')
                // Close the date picker after selection
                setIsDatePickerOpen(false)

                // Blur any focused date picker elements
                setTimeout(() => {
                  const activeElement = document.activeElement
                  if (activeElement && (
                    activeElement.closest('.react-datepicker') ||
                    activeElement.closest('.react-datepicker-wrapper')
                  )) {
                    activeElement.blur()
                  }
                }, 50)

                // Move to next column
                setTimeout(() => {
                  const event = new CustomEvent('datepicker-enter', {
                    detail: { moveToNextColumn: true }
                  })
                  document.dispatchEvent(event)
                }, 150)
              }}
              dateFormat="dd/MM/yyyy"
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer bg-gray-50"
              placeholderText="📅 Select date"
              showPopperArrow={false}
              popperClassName="react-datepicker-popper"
              calendarClassName="shadow-lg border border-gray-200 rounded-lg"
              wrapperClassName="w-full"
              autoComplete="off"
              isClearable={true}
              showYearDropdown={true}
              showMonthDropdown={true}
              dropdownMode="select"
              shouldCloseOnSelect={false}
              open={isDatePickerOpen}
              onClickOutside={() => setIsDatePickerOpen(false)}
              onClick={() => {
                if (!isDatePickerOpen) {
                  setIsDatePickerOpen(true)
                }
              }}
              onFocus={() => {
                if (!isDatePickerOpen) {
                  setIsDatePickerOpen(true)
                }
              }}
              onKeyDown={(e) => {
                // Allow normal date picker navigation
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.stopPropagation()
                  // Let the date picker handle these keys
                  return
                }

                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()

                  // If calendar is open, let it handle the Enter key for date selection
                  if (isDatePickerOpen) {
                    // Close the date picker
                    setIsDatePickerOpen(false)

                    // Blur the current element
                    setTimeout(() => {
                      const activeElement = document.activeElement
                      if (activeElement) {
                        activeElement.blur()
                      }
                    }, 50)

                    // Move to next column
                    setTimeout(() => {
                      const event = new CustomEvent('datepicker-enter', {
                        detail: { moveToNextColumn: true }
                      })
                      document.dispatchEvent(event)
                    }, 150)
                    return
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDatePickerOpen(false)
                } else if (e.key === ' ' || e.key === 'Spacebar') {
                  // Space key opens the date picker
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDatePickerOpen(true)
                } else {
                  // Prevent typing in the input
                  e.preventDefault()
                }
              }}
              onChangeRaw={(e) => {
                // Prevent manual input changes
                e.preventDefault()
              }}
              onCalendarOpen={() => {
                // Disable table navigation when calendar is open
                document.body.setAttribute('data-datepicker-open', 'true')
                setIsDatePickerOpen(true)

                // Focus the calendar after it opens
                setTimeout(() => {
                  const calendar = document.querySelector('.react-datepicker')
                  if (calendar) {
                    // Focus the selected date or today's date
                    const selectedDay = calendar.querySelector('.react-datepicker__day--selected') ||
                                       calendar.querySelector('.react-datepicker__day--today') ||
                                       calendar.querySelector('.react-datepicker__day:not(.react-datepicker__day--disabled)')
                    if (selectedDay) {
                      selectedDay.focus()
                    }
                  }
                }, 50)
              }}
              onCalendarClose={() => {
                // Re-enable table navigation when calendar is closed
                document.body.removeAttribute('data-datepicker-open')
                setIsDatePickerOpen(false)
              }}
            />
          </div>
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
        // Format the display value to remove leading zeros
        const displayValue = value ? formatNumberValue(value) : ''
        console.log('Number display:', { original: value, formatted: displayValue })

        return (
          <div
            onClick={(e) => {
              handleClick(e)
              // Let event bubble up to parent td for focus handling
            }}
            className="w-full px-2 py-1 cursor-pointer hover:bg-blue-50 rounded min-h-[24px] border border-transparent hover:border-blue-200"
            title="Click to edit"
            data-editable="true"
          >
            {displayValue || <span className="text-gray-400">0</span>}
          </div>
        )

      case 'textarea':
        return (
          <div
            onClick={(e) => {
              handleClick(e)
              // Let event bubble up to parent td for focus handling
            }}
            className="w-full px-2 py-1 cursor-pointer hover:bg-blue-50 rounded min-h-[60px] max-h-[100px] overflow-y-auto border border-transparent hover:border-blue-200"
            title="Click to edit comment"
            data-editable="true"
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
