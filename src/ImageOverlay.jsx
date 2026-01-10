import { useEffect, useState } from 'react'
import './ImageOverlay.css'

function ImageOverlay({
  open = false,
  images = [],
  startIndex = 0,
  title = 'Post Title Here',
  description = '',
  onClose
}) {
  if (!open || images.length === 0) return null

  const clamp = (n) => Math.min(Math.max(n, 0), images.length - 1)
  const [index, setIndex] = useState(clamp(startIndex))
  const src = images[index]

  const prev = () =>
    setIndex((i) => (i - 1 + images.length) % images.length)

  const next = () =>
    setIndex((i) => (i + 1) % images.length)

  useEffect(() => {
    setIndex(clamp(startIndex))
  }, [startIndex, images.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <div className="io-overlay" onClick={onClose} role="dialog">
      <div className="io-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <header className="io-header">
          <h2 className="io-title">{title}</h2>
          <button
            className="io-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {/* MEDIA */}
        <div className="io-media">
          <img src={src} alt={title} />
        </div>

        {/* NAVIGATION */}
        {images.length > 1 && (
          <div className="io-nav">
            <button onClick={prev}>‹</button>
            <span>{index + 1} / {images.length}</span>
            <button onClick={next}>›</button>
          </div>
        )}

        {/* DESCRIPTION */}
        {description && (
          <div className="io-footer">
            <p>{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageOverlay
