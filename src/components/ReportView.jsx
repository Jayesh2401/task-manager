import React, { useMemo } from 'react'
import { HistoryService } from '../services/historyService'

const ReportView = ({ reports, startDate, endDate, onClose }) => {
  // Group reports by date
  const groupedReports = useMemo(() => {
    const grouped = {}

    reports.forEach(report => {
      const date = report.date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(report)
    })

    // Sort dates in ascending order (old to new)
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b))

    return sortedDates.map(date => ({
      date,
      reports: grouped[date].sort((a, b) => new Date(a.createdAt?.toDate?.() || a.createdAt) - new Date(b.createdAt?.toDate?.() || b.createdAt))
    }))
  }, [reports])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Todo':
        return 'bg-gray-100 text-gray-800'
      case 'Archived':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto report-view">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Day End Report</h1>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {groupedReports.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-600">No day-end snapshots found for the selected date range.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedReports.map(({ date, reports: dateReports }) => (
              <div key={date} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Date Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 border-b border-gray-200 date-header">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      📅 {formatDate(date)}
                    </h2>
                    <div className="text-sm text-blue-100">
                      {dateReports.length} snapshot{dateReports.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Reports for this date */}
                <div className="divide-y divide-gray-200">
                  {dateReports.map((report, reportIndex) => (
                    <div key={report.id} className="p-6">
                      {/* Report Header */}
                      <div className="bg-gray-50 p-4 mb-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <h3 className="text-md font-semibold text-gray-900 flex items-center">
                              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                {reportIndex + 1}
                              </span>
                              Snapshot #{reportIndex + 1}
                            </h3>
                            <span className="text-sm text-gray-500 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              {formatTime(report.createdAt)}
                            </span>
                            {report.timeSpent && (
                              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {HistoryService.formatTimeSpent(report.timeSpent)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="bg-white p-3 rounded border text-center">
                            <div className="text-2xl font-bold text-gray-900">{report.totalTasks}</div>
                            <div className="text-gray-600">Total Tasks</div>
                          </div>
                          <div className="bg-white p-3 rounded border text-center">
                            <div className="text-2xl font-bold text-green-600">{report.completedTasks}</div>
                            <div className="text-gray-600">Completed</div>
                          </div>
                          <div className="bg-white p-3 rounded border text-center">
                            <div className="text-2xl font-bold text-blue-600">{report.inProgressTasks}</div>
                            <div className="text-gray-600">In Progress</div>
                          </div>
                          <div className="bg-white p-3 rounded border text-center">
                            <div className="text-2xl font-bold text-gray-600">{report.todoTasks}</div>
                            <div className="text-gray-600">Todo</div>
                          </div>
                        </div>
                      </div>

                      {/* Tasks Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '120px'}}>Client</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '150px'}}>Task</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '150px'}}>Sub Task</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '120px'}}>Allotted To</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '120px'}}>Team Leader</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '100px'}}>Priority</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '100px'}}>Status</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '110px'}}>Due Date</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '60px'}}>ET</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '80px'}}>Time Taken</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '200px'}}>Comment</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {report.tasks.map((task, taskIndex) => (
                              <tr key={taskIndex} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900" style={{width: '120px'}}>
                                  <div className="truncate" title={task.client}>
                                    {task.client || '-'}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900" style={{width: '150px'}}>
                                  <div className="truncate" title={task.task}>
                                    {task.task || '-'}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900" style={{width: '150px'}}>
                                  <div className="truncate" title={task.subTask}>
                                    {task.subTask || '-'}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900" style={{width: '120px'}}>
                                  <div className="truncate" title={task.allottedTo}>
                                    {task.allottedTo || '-'}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900" style={{width: '120px'}}>
                                  <div className="truncate" title={task.teamLeader}>
                                    {task.teamLeader || '-'}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm" style={{width: '100px'}}>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                    {task.priority || 'Medium'}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm" style={{width: '100px'}}>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                    {task.status || 'Todo'}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900" style={{width: '110px'}}>
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '-'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center" style={{width: '60px'}}>
                                  {task.estimatedTime || 0}h
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center" style={{width: '80px'}}>
                                  {task.timeTaken || 0}h
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900" style={{width: '200px'}}>
                                  <div className="truncate" title={task.comment}>
                                    {task.comment || '-'}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportView
