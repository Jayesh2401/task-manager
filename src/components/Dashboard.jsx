import React from 'react'

const Dashboard = ({ tasks }) => {
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

  const dashboardItems = [
    {
      title: 'All Task',
      count: totalTasks,
      bgColor: 'bg-gray-800',
      textColor: 'text-white'
    },
    {
      title: 'L',
      subtitle: 'Low',
      count: tasks.filter(task => task.priority === 'Low').length,
      bgColor: 'bg-red-500',
      textColor: 'text-white'
    },
    {
      title: 'D',
      subtitle: 'Due Today',
      count: dueTodayTasks,
      bgColor: 'bg-blue-500',
      textColor: 'text-white'
    },
    {
      title: 'D',
      subtitle: 'Due Tomorrow',
      count: 0,
      bgColor: 'bg-orange-500',
      textColor: 'text-white'
    },
    {
      title: 'T',
      subtitle: 'This Week',
      count: 0,
      bgColor: 'bg-green-500',
      textColor: 'text-white'
    },
    {
      title: 'E',
      subtitle: 'Est. Time',
      count: 0,
      bgColor: 'bg-purple-500',
      textColor: 'text-white'
    },
    {
      title: 'T',
      subtitle: 'Time Taken',
      count: 0,
      bgColor: 'bg-pink-500',
      textColor: 'text-white'
    },
    {
      title: 'M',
      subtitle: 'My Review',
      count: 0,
      bgColor: 'bg-teal-500',
      textColor: 'text-white'
    },
    {
      title: 'R',
      subtitle: 'Review By Others',
      count: 0,
      bgColor: 'bg-yellow-600',
      textColor: 'text-white'
    },
    {
      title: 'I',
      subtitle: 'In Process',
      count: inProgressTasks,
      bgColor: 'bg-amber-600',
      textColor: 'text-white'
    }
  ]

  const bottomItems = [
    {
      title: 'Completed',
      count: completedTasks,
      bgColor: 'bg-purple-600',
      textColor: 'text-white'
    },
    {
      title: 'Archived',
      count: archivedTasks,
      bgColor: 'bg-gray-500',
      textColor: 'text-white'
    }
  ]

  return (
    <div className="mb-6">
      {/* Top row of cards */}
      <div className="grid grid-cols-5 lg:grid-cols-10 gap-3 mb-4">
        {dashboardItems.map((item, index) => (
          <div key={index} className={`${item.bgColor} ${item.textColor} rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
            <div className="text-lg font-bold">{item.count}</div>
            <div className="text-2xl font-bold mb-1">{item.title}</div>
            <div className="text-xs opacity-90">{item.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Bottom row of cards */}
      <div className="grid grid-cols-2 gap-3 max-w-xs">
        {bottomItems.map((item, index) => (
          <div key={index} className={`${item.bgColor} ${item.textColor} rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
            <div className="text-lg font-bold">{item.count}</div>
            <div className="text-sm font-medium">{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
