import './Dashboard.css'
import { useEffect, useState } from 'react'

function Lightbox({ open, images = [], startIndex = 0, title = 'Post', onClose }) {
  if (!open || !images || images.length === 0) return null
  const clampIndex = (n) => Math.min(Math.max(n, 0), images.length - 1)
  const [index, setIndex] = useState(clampIndex(startIndex || 0))
  const src = images[index]

  const goPrev = () => setIndex((i) => (i - 1 + images.length) % images.length)
  const goNext = () => setIndex((i) => (i + 1) % images.length)

  useEffect(() => setIndex(clampIndex(startIndex || 0)), [startIndex])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, images.length])

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true">
      <div className="lightbox-header">
        <div className="lightbox-title">{title}</div>
        <button className="lightbox-close" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <div className="lightbox-body">
        <img src={src} alt="" className="lightbox-img" />
        {images.length > 1 && (
          <>
            <button className="lightbox-arrow lightbox-arrow-left" aria-label="Previous image" onClick={goPrev}>‹</button>
            <button className="lightbox-arrow lightbox-arrow-right" aria-label="Next image" onClick={goNext}>›</button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="lightbox-footer">
          <span>{index + 1}/{images.length}</span>
        </div>
      )}
    </div>
  )
}

export default Lightbox

