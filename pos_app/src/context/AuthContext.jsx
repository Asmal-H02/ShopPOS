import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('shoppos_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('shoppos_token')

    if (savedToken) {
      api.defaults.headers.common.Authorization = `Bearer ${savedToken}`
    }

    return savedToken
  })

  const login = async (username, password) => {
    const formData = new URLSearchParams()

    formData.append('username', username)
    formData.append('password', password)

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const { access_token, user } = response.data

    setToken(access_token)
    setUser(user)

    localStorage.setItem('shoppos_token', access_token)
    localStorage.setItem('shoppos_user', JSON.stringify(user))

    api.defaults.headers.common.Authorization = `Bearer ${access_token}`

    return user
  }

  const logout = () => {
    setToken(null)
    setUser(null)

    localStorage.removeItem('shoppos_token')
    localStorage.removeItem('shoppos_user')

    delete api.defaults.headers.common.Authorization
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}