import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import "react-datepicker/dist/react-datepicker.css"
import EditableCell from './EditableCell'
import DropdownModal from './modals/DropdownModal'
import FrequencyModal from './modals/FrequencyModal'
import AddUserModal from './modals/AddUserModal'
import DayEndModal from './modals/DayEndModal'
import DayEndReportModal from './modals/DayEndReportModal'
import ReportView from './ReportView'

const TaskTable = ({
  tasks,
  dataManager,
  selectedRows,
  setSelectedRows,
  updateTask,
  addNewTask,
  deleteSelectedTasks,
  onColumnAction,
  activeFilter,
  currentUser
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [activeModal, setActiveModal] = useState(null)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [currentCell, setCurrentCell] = useState({ taskId: null, field: null })
  const [refreshingColumns, setRefreshingColumns] = useState(new Set())
  const [showDeleteList, setShowDeleteList] = useState(false)
  const [deleteListType, setDeleteListType] = useState('')
  const [deletingItems, setDeletingItems] = useState(new Set())
  const [showDayEndModal, setShowDayEndModal] = useState(false)
  const [showDayEndReportModal, setShowDayEndReportModal] = useState(false)
  const [showReportView, setShowReportView] = useState(false)
  const [reportData, setReportData] = useState(null)
  const tableRef = useRef(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Excel-like navigation state
  const [focusedCell, setFocusedCell] = useState({ taskIndex: null, columnIndex: null })
  const [isNavigating, setIsNavigating] = useState(false)
  const [modalOpenedFrom, setModalOpenedFrom] = useState(null) // Track where modal was opened from

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])



  // Define table columns with responsive widths
  const getColumnWidth = (key) => {
    const baseWidths = {
      client: 120,
      task: 150,
      subTask: 150,
      estimatedTime: 80,
      allottedTo: 140,
      teamLeader: 140,
      priority: 100,
      dueDate: 120,
      frequency: 120,
      comment: 200,
      status: 120,
      timeTaken: 80
    }

    // Adjust widths based on window size
    const scaleFactor = windowWidth < 1200 ? 0.8 : windowWidth < 1600 ? 0.9 : 1
    return Math.floor(baseWidths[key] * scaleFactor)
  }

  const columns = useMemo(() => [
    { key: 'client', label: 'Client', type: 'dropdown', width: getColumnWidth('client') },
    { key: 'task', label: 'Task', type: 'dropdown', width: getColumnWidth('task') },
    { key: 'subTask', label: 'Sub Task', type: 'dropdown', width: getColumnWidth('subTask') },
    { key: 'estimatedTime', label: 'ET', type: 'number', width: getColumnWidth('estimatedTime') },
    { key: 'allottedTo', label: 'Allotted To', type: 'dropdown', width: getColumnWidth('allottedTo') },
    { key: 'teamLeader', label: 'Team Leader', type: 'dropdown', width: getColumnWidth('teamLeader') },
    { key: 'priority', label: 'Priority', type: 'dropdown', width: getColumnWidth('priority') },
    { key: 'dueDate', label: 'Due Date', type: 'date', width: getColumnWidth('dueDate') },
    { key: 'frequency', label: 'Frequency', type: 'frequency', width: getColumnWidth('frequency') },
    { key: 'comment', label: 'Comment', type: 'textarea', width: getColumnWidth('comment') },
    { key: 'status', label: 'Status', type: 'dropdown', width: getColumnWidth('status') },
    { key: 'timeTaken', label: 'Time Taken', type: 'number', width: getColumnWidth('timeTaken') }
  ], [windowWidth])

  const priorityOptions = useMemo(() => ['Low', 'Medium', 'High', 'Critical'], [])
  const statusOptions = useMemo(() => ['Todo', 'In Progress', 'Completed', 'Archived'], [])



  // Handle row selection
  const handleRowSelect = useCallback((taskId) => {
    setSelectedRows(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }, [setSelectedRows])

  const handleSelectAll = useCallback(() => {
    setSelectedRows(selectedRows.length === tasks.length ? [] : tasks.map(task => task.id))
  }, [setSelectedRows, selectedRows, tasks])

  // Handle cell click for dropdowns and special inputs
  const handleCellClick = useCallback((event, taskId, field, taskIndex, columnIndex) => {
    event.preventDefault()
    event.stopPropagation()

    const rect = event.currentTarget.getBoundingClientRect()
    setModalPosition({ x: rect.left, y: rect.bottom + 5 })
    setCurrentCell({ taskId, field })

    // Set focus and track modal origin since event won't bubble to td
    setIsNavigating(true)
    setFocusedCell({ taskIndex, columnIndex })
    setModalOpenedFrom({ taskIndex, columnIndex })

    if (['client', 'task', 'subTask', 'allottedTo', 'teamLeader', 'priority', 'status'].includes(field)) {
      setActiveModal('dropdown')
    } else if (field === 'frequency') {
      setActiveModal('frequency')
    }
  }, [])

  // Get dropdown options based on field
  const getDropdownOptions = useCallback((field) => {
    if (!dataManager) return []

    switch (field) {
      case 'client':
        // Client field uses client list
        return dataManager.data.clients.map(client => client.name || client)
      case 'allottedTo':
      case 'teamLeader':
        // Allotted To and Team Leader use user list
        return dataManager.data.users.map(user => user.name || user)
      case 'task':
        return dataManager.data.taskTemplates.map(template => template.name)
      case 'subTask':
        return dataManager.data.subtaskTemplates.map(template => template.name)
      case 'priority':
        return priorityOptions
      case 'status':
        return statusOptions
      default:
        return []
    }
  }, [dataManager, priorityOptions, statusOptions])

  // Handle dropdown selection
  const handleDropdownSelect = useCallback((value) => {
    // Check if this is an "Add New" request for client field
    if (currentCell.field === 'client' && value === 'ADD_NEW_CLIENT') {
      setActiveModal('addClientSimple')
      return
    }

    // Check if this is an "Add New" request for user fields
    if (['allottedTo', 'teamLeader'].includes(currentCell.field) && value === 'ADD_NEW_USER') {
      setActiveModal('addUser')
      return
    }

    // Check if this is an "Add New" request for task/subtask fields
    if (currentCell.field === 'task' && value === 'ADD_NEW_TASK') {
      setActiveModal('addTask')
      return
    }

    if (currentCell.field === 'subTask' && value === 'ADD_NEW_SUBTASK') {
      setActiveModal('addSubTask')
      return
    }

    // Normal selection
    if (currentCell.taskId && currentCell.field) {
      updateTask(currentCell.taskId, currentCell.field, value)
    }
    setActiveModal(null)
    setCurrentCell({ taskId: null, field: null })
  }, [currentCell, updateTask])

  // Handle frequency selection
  const handleFrequencySelect = useCallback((frequency) => {
    if (currentCell.taskId) {
      updateTask(currentCell.taskId, 'frequency', frequency)
    }
    setActiveModal(null)
    setCurrentCell({ taskId: null, field: null })
  }, [currentCell, updateTask])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]

    // Apply dashboard filter
    if (activeFilter && activeFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const startOfWeek = new Date()
      const endOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      switch (activeFilter) {
        case 'due-today':
          filtered = filtered.filter(task => task.dueDate === today)
          break
        case 'due-tomorrow':
          filtered = filtered.filter(task => task.dueDate === tomorrowStr)
          break
        case 'this-week':
          filtered = filtered.filter(task => {
            if (!task.dueDate) return false
            const taskDate = new Date(task.dueDate)
            return taskDate >= startOfWeek && taskDate <= endOfWeek
          })
          break
        case 'overdue':
          filtered = filtered.filter(task => {
            if (!task.dueDate) return false
            return new Date(task.dueDate) < new Date() && task.status !== 'Completed'
          })
          break
        case 'priority-low':
          filtered = filtered.filter(task => task.priority === 'Low')
          break
        case 'priority-high':
          filtered = filtered.filter(task => task.priority === 'High')
          break
        case 'status-todo':
          filtered = filtered.filter(task => task.status === 'Todo')
          break
        case 'status-inprogress':
          filtered = filtered.filter(task => task.status === 'In Progress')
          break
        case 'status-completed':
          filtered = filtered.filter(task => task.status === 'Completed')
          break
        case 'status-archived':
          filtered = filtered.filter(task => task.status === 'Archived')
          break
        default:
          break
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [tasks, sortConfig, activeFilter])

  // Handle cell activation for Excel-like navigation
  const handleCellActivation = useCallback((taskIndex, columnIndex) => {
    console.log('handleCellActivation called:', { taskIndex, columnIndex })
    const task = filteredAndSortedTasks[taskIndex]
    const column = columns[columnIndex]

    if (!task || !column) {
      console.log('No task or column found:', { task: !!task, column: !!column })
      return
    }

    console.log('Activating cell for column:', column.key, 'type:', column.type)

    // Create a mock event for positioning
    const tableElement = tableRef.current
    if (tableElement) {
      const cellElement = tableElement.querySelector(
        `tbody tr:nth-child(${taskIndex + 1}) td:nth-child(${columnIndex + 3})`
      )

      if (cellElement) {
        const rect = cellElement.getBoundingClientRect()
        setModalPosition({ x: rect.left, y: rect.bottom + 5 })
        setCurrentCell({ taskId: task.id, field: column.key })

        // Track where modal was opened from for focus restoration
        setModalOpenedFrom({ taskIndex, columnIndex })

        // Open appropriate modal/editor based on field type
        if (['client', 'task', 'subTask', 'allottedTo', 'teamLeader', 'priority', 'status'].includes(column.key)) {
          setActiveModal('dropdown')
        } else if (column.key === 'frequency') {
          setActiveModal('frequency')
        } else if (column.key === 'comment') {
          // For comment field, trigger direct editing like number fields
          const editableCell = cellElement.querySelector('[data-editable]')
          if (editableCell) {
            editableCell.click()
          }
        } else if (['estimatedTime', 'timeTaken'].includes(column.key)) {
          // For number fields, trigger direct editing
          const editableCell = cellElement.querySelector('[data-editable]')
          if (editableCell) {
            editableCell.click()
          }
        } else if (column.key === 'dueDate') {
          // For date fields, trigger date picker
          const dateInput = cellElement.querySelector('.react-datepicker__input-container input')
          if (dateInput) {
            dateInput.click()
          }
        }
      }
    }
  }, [filteredAndSortedTasks, columns])

  // Restore focus when modal closes
  useEffect(() => {
    if (!activeModal && modalOpenedFrom) {
      // Modal just closed - restore focus to where it was opened from
      setIsNavigating(true)
      setFocusedCell({
        taskIndex: modalOpenedFrom.taskIndex,
        columnIndex: modalOpenedFrom.columnIndex
      })
      setModalOpenedFrom(null)

      // Ensure table gets focus for keyboard navigation
      setTimeout(() => {
        if (tableRef.current) {
          tableRef.current.focus()
        }
      }, 100)
    }
  }, [activeModal, modalOpenedFrom])

  // Excel-like keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle navigation when not in a modal, table is focused, and not editing
      if (activeModal || !isNavigating) return

      // Don't handle navigation if date picker is open
      if (document.body.hasAttribute('data-datepicker-open')) {
        return
      }

      // Don't handle navigation if user is editing (typing in input/textarea)
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        // But allow if it's a date picker input that's not actually editable
        if (!activeElement.classList.contains('react-datepicker__input-container')) {
          return
        }
      }

      const { taskIndex, columnIndex } = focusedCell
      const maxTaskIndex = filteredAndSortedTasks.length - 1
      const maxColumnIndex = columns.length - 1

      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          console.log('Enter pressed on cell:', { taskIndex, columnIndex, isNavigating })
          if (taskIndex !== null && columnIndex !== null) {
            console.log('Activating cell:', { taskIndex, columnIndex })
            handleCellActivation(taskIndex, columnIndex)
          }
          break

        case 'Tab':
          e.preventDefault()
          if (taskIndex !== null && columnIndex !== null) {
            const nextColumnIndex = e.shiftKey
              ? (columnIndex > 0 ? columnIndex - 1 : maxColumnIndex)
              : (columnIndex < maxColumnIndex ? columnIndex + 1 : 0)

            const nextTaskIndex = !e.shiftKey && columnIndex === maxColumnIndex
              ? (taskIndex < maxTaskIndex ? taskIndex + 1 : 0)
              : e.shiftKey && columnIndex === 0
              ? (taskIndex > 0 ? taskIndex - 1 : maxTaskIndex)
              : taskIndex

            setFocusedCell({ taskIndex: nextTaskIndex, columnIndex: nextColumnIndex })
          }
          break

        case 'ArrowUp':
          e.preventDefault()
          if (taskIndex !== null && taskIndex > 0) {
            setFocusedCell(prev => ({ ...prev, taskIndex: taskIndex - 1 }))
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (taskIndex !== null && taskIndex < maxTaskIndex) {
            setFocusedCell(prev => ({ ...prev, taskIndex: taskIndex + 1 }))
          }
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (columnIndex !== null && columnIndex > 0) {
            setFocusedCell(prev => ({ ...prev, columnIndex: columnIndex - 1 }))
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (columnIndex !== null && columnIndex < maxColumnIndex) {
            setFocusedCell(prev => ({ ...prev, columnIndex: columnIndex + 1 }))
          }
          break

        case 'Escape':
          e.preventDefault()
          // In Excel-like behavior, Escape should not clear focus
          // It should just cancel any current editing and stay on the same cell
          // Focus remains on current cell for continued navigation
          break
      }
    }

    if (isNavigating) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNavigating, focusedCell, activeModal, filteredAndSortedTasks, columns, handleCellActivation])

  // Handle date picker Enter key event
  useEffect(() => {
    const handleDatePickerEnter = (e) => {
      if (e.detail?.moveToNextColumn && focusedCell.taskIndex !== null && focusedCell.columnIndex !== null) {
        const { taskIndex, columnIndex } = focusedCell
        const maxColumnIndex = columns.length - 1
        const maxTaskIndex = filteredAndSortedTasks.length - 1

        // Move to next column, or next row if at end of columns
        const nextColumnIndex = columnIndex < maxColumnIndex ? columnIndex + 1 : 0
        const nextTaskIndex = columnIndex === maxColumnIndex && taskIndex < maxTaskIndex ? taskIndex + 1 : taskIndex

        setFocusedCell({ taskIndex: nextTaskIndex, columnIndex: nextColumnIndex })

        // Move browser focus to the next cell
        setTimeout(() => {
          // First, remove focus from any date picker elements
          const activeElement = document.activeElement
          if (activeElement && activeElement.closest('.react-datepicker-wrapper')) {
            activeElement.blur()
          }

          // Find the next cell and focus it
          const nextCell = document.querySelector(
            `[data-task-index="${nextTaskIndex}"][data-column-index="${nextColumnIndex}"]`
          )

          if (nextCell) {
            // Focus the actual input/textarea inside the cell if it exists
            const editableElement = nextCell.querySelector('input, textarea, [data-editable]')
            if (editableElement) {
              editableElement.focus()
            } else {
              nextCell.focus()
            }
          } else {
            // Fallback: focus the table
            if (tableRef.current) {
              tableRef.current.focus()
            }
          }

          // Force navigation state to be active
          setIsNavigating(true)
        }, 250)
      }
    }

    document.addEventListener('datepicker-enter', handleDatePickerEnter)
    return () => document.removeEventListener('datepicker-enter', handleDatePickerEnter)
  }, [focusedCell, columns, filteredAndSortedTasks])

  // Handle report generation
  const handleShowReport = useCallback((reports, startDate, endDate) => {
    setReportData({ reports, startDate, endDate })
    setShowReportView(true)
  }, [])

  const handleCloseReport = useCallback(() => {
    setShowReportView(false)
    setReportData(null)
  }, [])

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // Handle column refresh with animation
  const handleColumnRefresh = useCallback(async (columnKey) => {
    setRefreshingColumns(prev => new Set([...prev, columnKey]))

    try {
      if (dataManager?.refresh) {
        if (['client', 'allottedTo', 'teamLeader'].includes(columnKey)) {
          await dataManager.refresh('users')
        } else if (columnKey === 'task') {
          await dataManager.refresh('taskTemplates')
        } else if (columnKey === 'subTask') {
          await dataManager.refresh('subtaskTemplates')
        }
      }

      // Simulate minimum loading time for better UX
      setTimeout(() => {
        setRefreshingColumns(prev => {
          const newSet = new Set(prev)
          newSet.delete(columnKey)
          return newSet
        })
      }, 1000)
    } catch (error) {
      console.error('Error refreshing data:', error)
      setRefreshingColumns(prev => {
        const newSet = new Set(prev)
        newSet.delete(columnKey)
        return newSet
      })
    }
  }, [dataManager])

  // Handle column delete - show list
  const handleColumnDelete = useCallback((columnKey) => {
    setDeleteListType(columnKey)
    setShowDeleteList(true)
  }, [])

  // Get usage count for an item
  const getUsageCount = useCallback((item, itemType) => {
    if (!tasks || tasks.length === 0) return 0

    const itemName = item.name || item
    let count = 0

    tasks.forEach(task => {
      if (itemType === 'user') {
        // Check if user is used in allottedTo or teamLeader fields
        if (task.allottedTo === itemName || task.teamLeader === itemName) {
          count++
        }
      } else if (itemType === 'client') {
        // Check if client is used in client field
        if (task.client === itemName) {
          count++
        }
      } else if (itemType === 'task template') {
        if (task.task === itemName) {
          count++
        }
      } else if (itemType === 'subtask template') {
        if (task.subTask === itemName) {
          count++
        }
      }
    })

    return count
  }, [tasks])

  // Handle individual item delete
  const handleIndividualDelete = useCallback(async (item, itemType) => {
    const itemName = item.name || item
    const usageCount = getUsageCount(item, itemType)

    // Check if item is in use
    if (usageCount > 0) {
      const confirmMessage = `"${itemName}" is currently used in ${usageCount} task${usageCount > 1 ? 's' : ''}.\n\nDeleting this ${itemType} will remove it from all tasks where it's used.\n\nAre you sure you want to continue?`
      if (!window.confirm(confirmMessage)) {
        return
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
        return
      }
    }

    // Set loading state
    setDeletingItems(prev => new Set([...prev, item.id]))

    try {
      if (itemType === 'user') {
        await dataManager.userOperations.delete(item.id)
      } else if (itemType === 'client') {
        await dataManager.clientOperations.delete(item.id)
      } else if (itemType === 'task template') {
        await dataManager.taskTemplateOperations.delete(item.id)
      } else if (itemType === 'subtask template') {
        await dataManager.subtaskTemplateOperations.delete(item.id)
      }

      // Show success message
      alert(`${itemName} has been deleted successfully!`)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(`Failed to delete ${itemName}. Please try again.`)
    } finally {
      // Remove loading state
      setDeletingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }, [dataManager, getUsageCount])

  // Get filter display name
  const getFilterDisplayName = (filterType) => {
    const filterNames = {
      'all': 'All Tasks',
      'due-today': 'Due Today',
      'due-tomorrow': 'Due Tomorrow',
      'this-week': 'This Week',
      'overdue': 'Overdue',
      'priority-low': 'Low Priority',
      'priority-high': 'High Priority',
      'status-todo': 'Todo',
      'status-inprogress': 'In Progress',
      'status-completed': 'Completed',
      'status-archived': 'Archived'
    }
    return filterNames[filterType] || filterType
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Action Bar */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        {/* Left side buttons */}
        <div className="flex items-center space-x-4">
          {/* Filter indicator */}
          {activeFilter && activeFilter !== 'all' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filtered by:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {getFilterDisplayName(activeFilter)}
              </span>
              <span className="text-sm text-gray-400">
                ({filteredAndSortedTasks.length} of {tasks.length} tasks)
              </span>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              disabled={selectedRows.length === 0}
              onClick={() => selectedRows.length > 0 && deleteSelectedTasks()}
            >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>Delete Selected ({selectedRows.length})</span>
          </button>

          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Export</span>
          </button>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDayEndReportModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Day End Report
          </button>

          <button
            onClick={addNewTask}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Task
          </button>

          <button
            onClick={() => setShowDayEndModal(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            End Day
          </button>
        </div>
      </div>



      {/* Table */}
      <div className="overflow-x-auto" ref={tableRef}>
        <table
          className="w-full"
          tabIndex={0}
          onFocus={() => {
            // Auto-focus first cell when table gets focus
            if (!isNavigating && filteredAndSortedTasks.length > 0) {
              setIsNavigating(true)
              setFocusedCell({ taskIndex: 0, columnIndex: 0 })
            }
          }}
        >
          <thead className="bg-gray-800 text-white">
            {/* First row: Action icons */}
            <tr className="bg-gray-700">
              <th className="px-3 py-2 w-12"></th>
              <th className="px-3 py-2 w-12"></th>
              {columns.map(column => (
                <th
                  key={`${column.key}-actions`}
                  className="px-3 py-2 text-center"
                  style={{ width: `${column.width}px`, minWidth: `${column.width}px`, maxWidth: `${column.width}px` }}
                >
                  {['client', 'task', 'subTask', 'allottedTo', 'teamLeader', 'status'].includes(column.key) && (
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onColumnAction && onColumnAction('add', column.key)
                        }}
                        className="p-1 text-green-400 hover:text-green-200 hover:bg-green-600 rounded"
                        title={`Add ${column.label}`}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleColumnRefresh(column.key)
                        }}
                        className="p-1 text-blue-400 hover:text-blue-200 hover:bg-blue-600 rounded"
                        title={`Refresh ${column.label}`}
                        disabled={refreshingColumns.has(column.key)}
                      >
                        <svg
                          className={`w-3 h-3 ${refreshingColumns.has(column.key) ? 'animate-spin' : ''}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleColumnDelete(column.key)
                        }}
                        className="p-1 text-red-400 hover:text-red-200 hover:bg-red-600 rounded"
                        title={`Delete ${column.label}`}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>

            {/* Second row: Column names */}
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.length === tasks.length && tasks.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">ID</th>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  style={{ width: `${column.width}px`, minWidth: `${column.width}px`, maxWidth: `${column.width}px` }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{column.label}</span>
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody
            className="bg-white divide-y divide-gray-200"
          >
            {filteredAndSortedTasks.map((task, taskIndex) => (
              <tr key={task.id} className={`hover:bg-gray-50 ${selectedRows.includes(task.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(task.id)}
                    onChange={() => handleRowSelect(task.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{taskIndex + 1}</td>
                {columns.map((column, columnIndex) => {
                  const isFocused = focusedCell.taskIndex === taskIndex && focusedCell.columnIndex === columnIndex
                  return (
                    <td
                      key={column.key}
                      data-task-index={taskIndex}
                      data-column-index={columnIndex}
                      tabIndex={isFocused ? 0 : -1}
                      className={`px-3 py-3 relative transition-all duration-200 ${
                        isFocused
                          ? 'bg-blue-50 ring-1 ring-blue-300 ring-inset'
                          : ''
                      }`}
                      style={{ width: `${column.width}px`, minWidth: `${column.width}px`, maxWidth: `${column.width}px` }}
                      onClick={() => {
                        // Always focus this exact column when clicked anywhere in the cell
                        setIsNavigating(true)
                        setFocusedCell({ taskIndex, columnIndex })

                        // Track where modal might be opened from for focus restoration
                        setModalOpenedFrom({ taskIndex, columnIndex })

                        // Ensure table gets focus for keyboard navigation
                        setTimeout(() => {
                          if (tableRef.current) {
                            tableRef.current.focus()
                          }
                        }, 50)
                      }}
                    >
                      <div className="truncate">
                        <EditableCell
                          value={task[column.key]}
                          type={column.type}
                          onChange={(value) => {
                            updateTask(task.id, column.key, value)
                            // Date field focus management is now handled by the date picker detection
                          }}
                          onClick={column.type === 'date' ? undefined : (e) => handleCellClick(e, task.id, column.key, taskIndex, columnIndex)}
                        />
                      </div>
                      {isFocused && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-0 left-0 w-full h-full border border-blue-400 rounded-sm opacity-30"></div>
                          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {activeModal === 'dropdown' && (
        <DropdownModal
          options={getDropdownOptions(currentCell.field)}
          position={modalPosition}
          onSelect={handleDropdownSelect}
          onClose={() => setActiveModal(null)}
          allowAddNew={['client', 'task', 'subTask', 'allottedTo', 'teamLeader'].includes(currentCell.field)}
          fieldType={currentCell.field}
        />
      )}

      {activeModal === 'frequency' && (
        <FrequencyModal
          position={modalPosition}
          onSelect={handleFrequencySelect}
          onClose={() => setActiveModal(null)}
          currentValue={currentCell.taskId ? tasks.find(t => t.id === currentCell.taskId)?.frequency || 'None' : 'None'}
        />
      )}



      {/* Add User Modal */}
      {activeModal === 'addUser' && dataManager && (
        <AddUserModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null)
            setCurrentCell({ taskId: null, field: null })
          }}
          onAdd={async (userData) => {
            try {
              await dataManager.userOperations.add(userData)
              // If we have a current cell, update it with the new user's name
              if (currentCell.taskId && currentCell.field) {
                updateTask(currentCell.taskId, currentCell.field, userData.name)
              }
              setActiveModal(null)
              setCurrentCell({ taskId: null, field: null })
            } catch (error) {
              console.error('Error adding user:', error)
              alert('Failed to add user. Please try again.')
            }
          }}
        />
      )}

      {/* Add Task Template Modal */}
      {activeModal === 'addTask' && dataManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Task Template</h3>
            <input
              type="text"
              placeholder="Enter task name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const taskName = e.target.value.trim()
                  try {
                    await dataManager.taskTemplateOperations.add({ name: taskName })
                    // If we have a current cell, update it with the new task name
                    if (currentCell.taskId && currentCell.field) {
                      updateTask(currentCell.taskId, currentCell.field, taskName)
                    }
                    setActiveModal(null)
                    setCurrentCell({ taskId: null, field: null })
                  } catch (error) {
                    console.error('Error adding task template:', error)
                    alert('Failed to add task template. Please try again.')
                  }
                } else if (e.key === 'Escape') {
                  setActiveModal(null)
                  setCurrentCell({ taskId: null, field: null })
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setActiveModal(null)
                  setCurrentCell({ taskId: null, field: null })
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SubTask Template Modal */}
      {activeModal === 'addSubTask' && dataManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add SubTask Template</h3>
            <input
              type="text"
              placeholder="Enter subtask name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const subtaskName = e.target.value.trim()
                  try {
                    await dataManager.subtaskTemplateOperations.add({ name: subtaskName })
                    // If we have a current cell, update it with the new subtask name
                    if (currentCell.taskId && currentCell.field) {
                      updateTask(currentCell.taskId, currentCell.field, subtaskName)
                    }
                    setActiveModal(null)
                    setCurrentCell({ taskId: null, field: null })
                  } catch (error) {
                    console.error('Error adding subtask template:', error)
                    alert('Failed to add subtask template. Please try again.')
                  }
                } else if (e.key === 'Escape') {
                  setActiveModal(null)
                  setCurrentCell({ taskId: null, field: null })
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setActiveModal(null)
                  setCurrentCell({ taskId: null, field: null })
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Simple Modal (for dropdown "Add New Client") */}
      {activeModal === 'addClientSimple' && dataManager && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setActiveModal(null)
              setCurrentCell({ taskId: null, field: null })
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Add Client
              </h3>
              <button
                onClick={() => {
                  setActiveModal(null)
                  setCurrentCell({ taskId: null, field: null })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const clientData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone')
              }

              if (!clientData.name || !clientData.email) {
                alert('Please fill in all required fields')
                return
              }

              try {
                await dataManager.clientOperations.add(clientData)
                // If we have a current cell, update it with the new client name
                if (currentCell.taskId && currentCell.field) {
                  updateTask(currentCell.taskId, currentCell.field, clientData.name)
                }
                setActiveModal(null)
                setCurrentCell({ taskId: null, field: null })
              } catch (error) {
                console.error('Error adding client:', error)
                alert('Failed to add client. Please try again.')
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter client name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null)
                    setCurrentCell({ taskId: null, field: null })
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {activeModal === 'addClient' && dataManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Client</h3>
            <input
              type="text"
              placeholder="Enter client name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const clientName = e.target.value.trim()
                  try {
                    await dataManager.clientOperations.add({ name: clientName })
                    // If we have a current cell, update it with the new client name
                    if (currentCell.taskId && currentCell.field) {
                      updateTask(currentCell.taskId, currentCell.field, clientName)
                    }
                    setActiveModal(null)
                    setCurrentCell({ taskId: null, field: null })
                  } catch (error) {
                    console.error('Error adding client:', error)
                    alert('Failed to add client. Please try again.')
                  }
                } else if (e.key === 'Escape') {
                  setActiveModal(null)
                  setCurrentCell({ taskId: null, field: null })
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setActiveModal(null)
                  setCurrentCell({ taskId: null, field: null })
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete List Modal */}
      {showDeleteList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Delete {deleteListType === 'client' ? 'Clients' :
                       deleteListType === 'task' ? 'Task Templates' :
                       deleteListType === 'subTask' ? 'SubTask Templates' :
                       deleteListType === 'allottedTo' ? 'Users' :
                       deleteListType === 'teamLeader' ? 'Users' : 'Items'}
              </h3>
              <button
                onClick={() => setShowDeleteList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bulk Actions */}
            {/* <div className="flex space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Delete Selected</span>
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Export CSV</span>
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5a2 2 0 00-2-2v8z" />
                </svg>
                <span>Copy Report</span>
              </button>
              <button
                onClick={addNewTask}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Add Task</span>
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>End Day</span>
              </button>
            </div> */}

            {/* Items List */}
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              {(() => {
                let items = []
                let itemType = ''

                if (deleteListType === 'client') {
                  items = dataManager?.data.clients || []
                  itemType = 'client'
                } else if (['allottedTo', 'teamLeader'].includes(deleteListType)) {
                  items = dataManager?.data.users || []
                  itemType = 'user'
                } else if (deleteListType === 'task') {
                  items = dataManager?.data.taskTemplates || []
                  itemType = 'task template'
                } else if (deleteListType === 'subTask') {
                  items = dataManager?.data.subtaskTemplates || []
                  itemType = 'subtask template'
                }

                if (items.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4m-12 0H4m8 0V9m0 4v6m0-6h4m-4 0H8" />
                      </svg>
                      <p className="text-lg font-medium">No {itemType}s found</p>
                      <p className="text-sm mt-1">There are no {itemType}s to delete</p>
                    </div>
                  )
                }

                return (
                  <div className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <div key={item.id || index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {(item.name || item).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.name || item}
                              </p>
                              {item.email && (
                                <p className="text-sm text-gray-500 truncate">
                                  {item.email}
                                </p>
                              )}
                              {item.phone && (
                                <p className="text-sm text-gray-500">
                                  {item.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {(() => {
                            const usageCount = getUsageCount(item, itemType)
                            return (
                              <span className={`text-xs px-2 py-1 rounded ${
                                usageCount > 0
                                  ? 'text-orange-700 bg-orange-100'
                                  : 'text-gray-500 bg-gray-100'
                              }`}>
                                {usageCount > 0 ? `Used in ${usageCount} task${usageCount > 1 ? 's' : ''}` : 'Not used'}
                              </span>
                            )
                          })()}
                          <button
                            onClick={() => handleIndividualDelete(item, itemType)}
                            disabled={deletingItems.has(item.id)}
                            className={`p-2 rounded-full transition-colors ${
                              deletingItems.has(item.id)
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            }`}
                            title={deletingItems.has(item.id) ? "Deleting..." : "Delete this item"}
                          >
                            {deletingItems.has(item.id) ? (
                              <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Day End Modal */}
      <DayEndModal
        isOpen={showDayEndModal}
        onClose={() => setShowDayEndModal(false)}
        tasks={filteredAndSortedTasks}
        currentUser={currentUser}
      />

      {/* Day End Report Modal */}
      <DayEndReportModal
        isOpen={showDayEndReportModal}
        onClose={() => setShowDayEndReportModal(false)}
        onShowReport={handleShowReport}
        currentUser={currentUser}
      />

      {/* Report View */}
      {showReportView && reportData && (
        <ReportView
          reports={reportData.reports}
          startDate={reportData.startDate}
          endDate={reportData.endDate}
          onClose={handleCloseReport}
        />
      )}
    </div>
  )
}

export default TaskTable
