import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import { HistoryService } from '../../services/historyService'

const DayEndReportModal = ({ isOpen, onClose, onShowReport, currentUser }) => {
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true)

      const startDateString = startDate.toISOString().split('T')[0]
      const endDateString = endDate.toISOString().split('T')[0]

      console.log('Generating report with:', {
        startDateString,
        endDateString,
        userEmail: currentUser.email
      })

      if (startDateString > endDateString) {
        alert('Start date cannot be after end date')
        return
      }

      const reports = await HistoryService.getDayEndReports(
        startDateString,
        endDateString,
        currentUser.email
      )

      console.log('Reports received:', reports)

      if (reports.length === 0) {
        alert(`No data found for the selected date range (${startDateString} to ${endDateString}). Please make sure you have saved day-end snapshots for these dates.`)
        return
      }

      onShowReport(reports, startDateString, endDateString)
      onClose()
    } catch (error) {
      console.error('Error generating report:', error)
      alert(`Failed to generate report: ${error.message}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  const handleDebug = async () => {
    try {
      console.log('Debug: Checking all task history documents...')
      const allDocs = await HistoryService.getAllTaskHistory(currentUser.email)
      console.log('Debug: Found documents:', allDocs)
      alert(`Found ${allDocs.length} task history documents. Check console for details.`)
    } catch (error) {
      console.error('Debug error:', error)
      alert(`Debug error: ${error.message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Day End Report
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
          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholderText="Select start date"
              maxDate={new Date()}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholderText="Select end date"
              maxDate={new Date()}
              minDate={startDate}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
          </div>

          {/* Info */}
          <div className="bg-orange-50 p-3 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-orange-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-orange-700">
                <p className="font-medium">Report Information</p>
                <p className="mt-1">
                  This will generate a report showing all day-end snapshots within the selected date range. 
                  Data will be grouped by date and displayed in read-only format.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleDebug}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium"
            disabled={isLoading}
          >
            Debug
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DayEndReportModal
