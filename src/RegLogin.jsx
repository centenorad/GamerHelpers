import { useState } from 'react'
import './RegLogin.css'
import arenaBackground from './assets/arenabackground.png'

function EyeIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}

export function SignUp({ open, onClose }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!open) return null

  return (
    <div
      className="signup-overlay"
      style={{ backgroundImage: `url(${arenaBackground})` }}
      role="dialog"
      aria-modal="true"
    >
      <div className="signup-scrim" />
      <div className="signup-card">
        <button aria-label="Close" className="signup-close" onClick={onClose}>
          ×
        </button>
        <h2 className="signup-title">CREATE ACCOUNT</h2>

        <form
          className="signup-form"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="signup-label">
            <span>Name</span>
            <input className="signup-input" type="text" name="name" required />
          </label>

          <label className="signup-label">
            <span>Email address</span>
            <input
              className="signup-input"
              type="email"
              name="email"
              required
            />
          </label>

          <label className="signup-label">
            <span>Password</span>
            <div className="signup-input-wrap">
              <input
                className="signup-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon />
              </button>
            </div>
          </label>

          <label className="signup-label">
            <span>Confirm password</span>
            <div className="signup-input-wrap">
              <input
                className="signup-input"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
                title={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                <EyeIcon />
              </button>
            </div>
          </label>

          <label className="signup-terms">
            <input type="checkbox" required />
            <span>
              I read and agree to{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>
                terms and conditions
              </a>
              .
            </span>
          </label>

          <div className="signup-actions">
            <button type="submit" className="signup-submit" aria-label="Submit">
              <span className="arrow">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Login({ open, onClose, onOpenSignUp }) {
  const [showPassword, setShowPassword] = useState(false)

  if (!open) return null

  return (
    <div
      className="login-overlay"
      style={{ backgroundImage: `url(${arenaBackground})` }}
      role="dialog"
      aria-modal="true"
    >
      <div className="login-scrim" />
      <div className="login-card">
        <button aria-label="Close" className="login-close" onClick={onClose}>
          ×
        </button>
        <h2 className="login-title">Login</h2>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="login-label">
            <span>Email address</span>
            <input className="login-input" type="email" name="email" required />
          </label>

          <label className="login-label">
            <span>Password</span>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon />
              </button>
            </div>
          </label>

          <label className="login-remember">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          <div className="login-actions">
            <button type="submit" className="login-submit" aria-label="Submit">
              <span className="arrow">→</span>
            </button>
          </div>
        </form>

        <p className="login-small">
          No account yet?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (onOpenSignUp) onOpenSignUp()
            }}
          >
            Click here!
          </a>
        </p>
      </div>
    </div>
  )
}

export default { Login, SignUp }


