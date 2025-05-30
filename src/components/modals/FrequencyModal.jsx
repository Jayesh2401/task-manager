import React, { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'

const FrequencyModal = ({ position, onSelect, onClose, currentValue = 'None' }) => {
  const [selectedFrequency, setSelectedFrequency] = useState(currentValue)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const modalRef = useRef(null)

  // Parse current value if it contains date information
  useEffect(() => {
    if (currentValue && currentValue !== 'None' && currentValue.includes('|')) {
      const parts = currentValue.split('|')
      if (parts.length >= 1) {
        setSelectedFrequency(parts[0])
      }
      if (parts.length >= 2 && parts[1]) {
        setStartDate(new Date(parts[1]))
      }
      if (parts.length >= 3 && parts[2]) {
        setEndDate(new Date(parts[2]))
      }
    }
  }, [currentValue])

  const frequencyOptions = [
    'Daily',
    'Weekly',
    'Fortnightly',
    'Monthly',
    'Quarterly',
    'Half Yearly',
    'Yearly',
    'None'
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleConfirm = () => {
    let frequencyValue = selectedFrequency

    // If frequency is not 'None' and dates are selected, include them
    if (selectedFrequency !== 'None') {
      if (startDate || endDate) {
        const startDateStr = startDate ? startDate.toISOString().split('T')[0] : ''
        const endDateStr = endDate ? endDate.toISOString().split('T')[0] : ''
        frequencyValue = `${selectedFrequency}|${startDateStr}|${endDateStr}`
      }
    }

    console.log('Frequency value being saved:', frequencyValue)
    onSelect(frequencyValue)
  }

  const handleCancel = () => {
    onClose()
  }

  const needsDateRange = selectedFrequency !== 'None'

  // Calculate dynamic position to stay within viewport
  const calculatePosition = () => {
    const modalWidth = 500
    const modalHeight = 450
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = position.x
    let top = position.y + 10

    // Adjust horizontal position if modal would go off-screen
    if (left + modalWidth > viewportWidth - 20) {
      left = viewportWidth - modalWidth - 20
    }
    if (left < 20) {
      left = 20
    }

    // Adjust vertical position if modal would go off-screen
    if (top + modalHeight > viewportHeight - 20) {
      top = position.y - modalHeight - 10
    }
    if (top < 20) {
      top = 20
    }

    return { left, top }
  }

  const modalPosition = calculatePosition()

  return (
    <div
      ref={modalRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl w-[500px] frequency-modal"
      style={{
        left: modalPosition.left,
        top: modalPosition.top,
        maxHeight: '450px',
        zIndex: 9999
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Select Task Frequency</h3>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Frequency Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Frequency:
            </label>
            <div className="space-y-2">
              {frequencyOptions.map((option) => (
                <label key={option} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="radio"
                    name="frequency"
                    value={option}
                    checked={selectedFrequency === option}
                    onChange={(e) => setSelectedFrequency(e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Right Column - Date Range */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date:
              </label>
              <div className="text-xs text-gray-500 mb-1">Set start date</div>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="📅 Select start date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-gray-50"
                showPopperArrow={false}
                popperClassName="z-[10000]"
                calendarClassName="shadow-lg border border-gray-200 rounded-lg"
                isClearable={true}
                showYearDropdown={true}
                showMonthDropdown={true}
                dropdownMode="select"
                onKeyDown={(e) => {
                  // Prevent all typing - only allow calendar interaction
                  e.preventDefault()
                }}
                onChangeRaw={(e) => {
                  // Prevent manual input changes
                  e.preventDefault()
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date:
              </label>
              <div className="text-xs text-gray-500 mb-1">Set end date</div>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="📅 Select end date"
                minDate={startDate}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-gray-50"
                showPopperArrow={false}
                popperClassName="z-[10000]"
                calendarClassName="shadow-lg border border-gray-200 rounded-lg"
                isClearable={true}
                showYearDropdown={true}
                showMonthDropdown={true}
                dropdownMode="select"
                onKeyDown={(e) => {
                  // Prevent all typing - only allow calendar interaction
                  e.preventDefault()
                }}
                onChangeRaw={(e) => {
                  // Prevent manual input changes
                  e.preventDefault()
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
        <button
          onClick={handleConfirm}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          className="px-6 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default FrequencyModal
