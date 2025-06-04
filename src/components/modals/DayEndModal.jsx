import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import { HistoryService } from '../../services/historyService'

const DayEndModal = ({ isOpen, onClose, tasks, currentUser }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeSpent, setTimeSpent] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleTimeChange = (field, value) => {
    const numValue = parseInt(value, 10) || 0
    
    // Validate ranges
    let validatedValue = numValue
    if (field === 'hours' && numValue > 23) validatedValue = 23
    if ((field === 'minutes' || field === 'seconds') && numValue > 59) validatedValue = 59
    if (numValue < 0) validatedValue = 0

    setTimeSpent(prev => ({
      ...prev,
      [field]: validatedValue
    }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      const dateString = selectedDate.toISOString().split('T')[0]

      console.log('Saving day-end snapshot:', {
        dateString,
        timeSpent,
        userEmail: currentUser.email,
        tasksCount: tasks.length
      })

      const snapshotId = await HistoryService.saveDayEndSnapshot(
        tasks,
        dateString,
        timeSpent,
        currentUser.email
      )

      console.log('Day-end snapshot saved with ID:', snapshotId)
      alert('Day-end snapshot saved successfully!')
      onClose()
    } catch (error) {
      console.error('Error saving day-end snapshot:', error)
      alert(`Failed to save day-end snapshot: ${error.message}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Day End
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select date"
              maxDate={new Date()}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
          </div>

          {/* Time Spent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Spent (HH:MM:SS)
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={timeSpent.hours}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  placeholder="HH"
                />
                <div className="text-xs text-gray-500 text-center mt-1">Hours</div>
              </div>
              <div className="flex items-center text-gray-500 font-bold">:</div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timeSpent.minutes}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  placeholder="MM"
                />
                <div className="text-xs text-gray-500 text-center mt-1">Minutes</div>
              </div>
              <div className="flex items-center text-gray-500 font-bold">:</div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timeSpent.seconds}
                  onChange={(e) => handleTimeChange('seconds', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  placeholder="SS"
                />
                <div className="text-xs text-gray-500 text-center mt-1">Seconds</div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Tasks:</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium text-green-600">
                  {tasks.filter(task => task.status === 'Completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>In Progress:</span>
                <span className="font-medium text-blue-600">
                  {tasks.filter(task => task.status === 'In Progress').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Todo:</span>
                <span className="font-medium text-gray-600">
                  {tasks.filter(task => task.status === 'Todo').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Day End'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DayEndModal
