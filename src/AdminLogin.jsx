import './Admin.css'
import brandLogo from './assets/logo.png'
import { useState } from 'react'

function AdminLogin({ onCancel, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (email.trim().toLowerCase() === 'admin@gmail.com' && password === 'Admin123') {
      setError('')
      onSuccess && onSuccess()
    } else {
      setError('Invalid admin credentials.')
    }
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-brand">
          <img src={brandLogo} alt="Gamer Helpers" />
          <span>Admin Login</span>
        </div>
        <button className="admin-back" onClick={onCancel}>← Back</button>
      </header>

      <main className="admin-main">
        <section className="admin-card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h3>Sign in</h3>
          <form
            onSubmit={submit}
            className="admin-form"
            style={{ flexDirection: 'column', alignItems: 'stretch' }}
          >
            <label style={{ fontSize: 12, opacity: 0.8 }}>Email</label>
            <input
              className="admin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
            />
            <label style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>Password</label>
            <input
              className="admin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin123"
              required
            />
            {error ? <div style={{ color: '#ff8b8b', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="admin-btn">Sign in</button>
              <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default AdminLogin

