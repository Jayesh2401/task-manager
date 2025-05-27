import { useEffect } from 'react'

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Create a key combination string
      const keys = []
      
      if (event.ctrlKey) keys.push('ctrl')
      if (event.shiftKey) keys.push('shift')
      if (event.altKey) keys.push('alt')
      if (event.metaKey) keys.push('meta')
      
      // Add the main key
      const key = event.key.toLowerCase()
      if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        keys.push(key)
      }
      
      const combination = keys.join('+')
      
      // Check if this combination exists in our shortcuts
      if (shortcuts[combination]) {
        event.preventDefault()
        shortcuts[combination]()
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}

export default useKeyboardShortcuts
