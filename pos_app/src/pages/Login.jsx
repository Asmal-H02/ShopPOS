import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const loggedInUser = await login(username, password)

      if (loggedInUser.role === 'admin') {
        navigate('/admin')
      } else if (loggedInUser.role === 'cashier') {
        navigate('/cashier')
      }
    } catch (error) {
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Unable to connect to the server.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-brand">
          <div className="login-brand-mark">
            S
          </div>

          <h1>Sirisara</h1>
          <span>STORES</span>
        </div>

        <div className="login-card">

          <div className="login-card-header">
            <h2>Welcome back</h2>

            <p>
              Sign in to access the ShopPOS system.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <div className="login-field">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>
        </div>

        <div className="login-footer">
          ShopPOS · Sirisara Stores
        </div>

      </div>
    </div>
  )
}

export default Login