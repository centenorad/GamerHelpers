import { useEffect } from 'react'
import './Toast.css'

function Toast({ message, onClose, variant = 'success' }) {
  useEffect(() => {
    const id = setTimeout(() => {
      onClose && onClose()
    }, 2500)
    return () => clearTimeout(id)
  }, [onClose])

  if (!message) return null

  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <div className={`toast toast-${variant}`}>
        <span className="toast-icon">✔</span>
        <span className="toast-msg">{message}</span>
        <button className="toast-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default Toast

