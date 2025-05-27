import React, { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'

const FrequencyModal = ({ position, onSelect, onClose }) => {
  const [selectedFrequency, setSelectedFrequency] = useState('None')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const modalRef = useRef(null)

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
    onSelect(selectedFrequency, startDate, endDate)
  }

  const handleCancel = () => {
    onClose()
  }

  const needsDateRange = selectedFrequency !== 'None'

  return (
    <div
      ref={modalRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-96"
      style={{
        left: Math.max(10, position.x - 200),
        top: position.y + 10
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
                placeholderText="dd/mm/yyyy"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholderText="dd/mm/yyyy"
                minDate={startDate}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
