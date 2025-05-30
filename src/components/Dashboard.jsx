import React from 'react'

const Dashboard = ({ tasks, activeFilter, onFilterClick }) => {
  // Calculate dashboard metrics
  const totalTasks = tasks.length
  const todoTasks = tasks.filter(task => task.status === 'Todo').length
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length
  const completedTasks = tasks.filter(task => task.status === 'Completed').length
  const archivedTasks = tasks.filter(task => task.status === 'Archived').length

  // Due today tasks
  const today = new Date().toISOString().split('T')[0]
  const dueTodayTasks = tasks.filter(task => task.dueDate === today).length

  // Overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && task.status !== 'Completed'
  }).length

  // Due tomorrow tasks
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const dueTomorrowTasks = tasks.filter(task => task.dueDate === tomorrowStr).length

  // This week tasks
  const startOfWeek = new Date()
  const endOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  const thisWeekTasks = tasks.filter(task => {
    if (!task.dueDate) return false
    const taskDate = new Date(task.dueDate)
    return taskDate >= startOfWeek && taskDate <= endOfWeek
  }).length

  // Helper function to format number values (same as EditableCell)
  const formatNumberValue = (value) => {
    if (!value || value === '' || value === null || value === undefined) return 0

    const numStr = value.toString().trim()

    // Handle empty or invalid strings
    if (numStr === '' || numStr === '0' || numStr === '00' || numStr === '000') {
      return 0
    }

    // If it's a decimal number (contains a dot)
    if (numStr.includes('.')) {
      const num = parseFloat(numStr)
      return isNaN(num) ? 0 : num
    }

    // If it's a whole number, remove leading zeros
    const num = parseInt(numStr, 10)
    return isNaN(num) ? 0 : num
  }

  // Calculate total estimated time and time taken with proper formatting
  const totalEstimatedTime = tasks.reduce((sum, task) => {
    const formattedValue = formatNumberValue(task.estimatedTime)
    return sum + formattedValue
  }, 0)

  const totalTimeTaken = tasks.reduce((sum, task) => {
    const formattedValue = formatNumberValue(task.timeTaken)
    return sum + formattedValue
  }, 0)

  const dashboardItems = [
    {
      title: 'All Task',
      count: totalTasks,
      bgColor: 'bg-gray-800',
      textColor: 'text-white',
      filterType: 'all'
    },
    {
      title: 'L',
      subtitle: 'Low',
      count: tasks.filter(task => task.priority === 'Low').length,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      filterType: 'priority-low'
    },
    {
      title: 'D',
      subtitle: 'Due Today',
      count: dueTodayTasks,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      filterType: 'due-today'
    },
    {
      title: 'D',
      subtitle: 'Due Tomorrow',
      count: dueTomorrowTasks,
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      filterType: 'due-tomorrow'
    },
    {
      title: 'T',
      subtitle: 'This Week',
      count: thisWeekTasks,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      filterType: 'this-week'
    },
    {
      title: 'E',
      subtitle: 'Est. Time',
      count: totalEstimatedTime,
      bgColor: 'bg-purple-500',
      textColor: 'text-white',
      filterType: 'estimated-time'
    },
    {
      title: 'T',
      subtitle: 'Time Taken',
      count: totalTimeTaken,
      bgColor: 'bg-pink-500',
      textColor: 'text-white',
      filterType: 'time-taken'
    },
    {
      title: 'O',
      subtitle: 'Overdue',
      count: overdueTasks,
      bgColor: 'bg-red-600',
      textColor: 'text-white',
      filterType: 'overdue'
    },
    {
      title: 'H',
      subtitle: 'High Priority',
      count: tasks.filter(task => task.priority === 'High').length,
      bgColor: 'bg-yellow-600',
      textColor: 'text-white',
      filterType: 'priority-high'
    },
    {
      title: 'I',
      subtitle: 'In Process',
      count: inProgressTasks,
      bgColor: 'bg-amber-600',
      textColor: 'text-white',
      filterType: 'status-inprogress'
    }
  ]

  const bottomItems = [
    {
      title: 'Completed',
      count: completedTasks,
      bgColor: 'bg-purple-600',
      textColor: 'text-white',
      filterType: 'status-completed'
    },
    {
      title: 'Archived',
      count: archivedTasks,
      bgColor: 'bg-gray-500',
      textColor: 'text-white',
      filterType: 'status-archived'
    }
  ]

  return (
    <div className="mb-6">
      {/* Top row of cards */}
      <div className="grid grid-cols-5 lg:grid-cols-10 gap-3 mb-4">
        {dashboardItems.map((item, index) => {
          const isActive = activeFilter === item.filterType
          return (
            <div
              key={index}
              className={`${item.bgColor} ${item.textColor} rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-105 ${
                isActive ? 'ring-4 ring-white ring-opacity-50 scale-105' : ''
              }`}
              onClick={() => onFilterClick(item.filterType)}
            >
              <div className="text-lg font-bold">{item.count}</div>
              <div className="text-2xl font-bold mb-1">{item.title}</div>
              <div className="text-xs opacity-90">{item.subtitle}</div>
              {isActive && (
                <div className="text-xs mt-1 opacity-75">
                  ✓ Active Filter
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom row of cards */}
      <div className="grid grid-cols-2 gap-3 max-w-xs">
        {bottomItems.map((item, index) => {
          const isActive = activeFilter === item.filterType
          return (
            <div
              key={index}
              className={`${item.bgColor} ${item.textColor} rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-105 ${
                isActive ? 'ring-4 ring-white ring-opacity-50 scale-105' : ''
              }`}
              onClick={() => onFilterClick(item.filterType)}
            >
              <div className="text-lg font-bold">{item.count}</div>
              <div className="text-sm font-medium">{item.title}</div>
              {isActive && (
                <div className="text-xs mt-1 opacity-75">
                  ✓ Active Filter
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
