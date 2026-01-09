import { useEffect } from 'react'
import './ImageOverlay.css'

function ImageOverlay({ src, title = 'Image', onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!src) return null

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true">
      <div className="lightbox-backdrop" onClick={onClose} />
      <div className="lightbox-card">
        <div className="lightbox-header">
          <div className="lightbox-title">{title}</div>
          <button className="lightbox-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="lightbox-media">
          <img src={src} alt={title} />
        </div>
      </div>
    </div>
  )
}

export default ImageOverlay

