import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('user')
    const savedIsAdmin = localStorage.getItem('isAdmin')
    const savedIsSuperAdmin = localStorage.getItem('isSuperAdmin')
    
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setIsAdmin(savedIsAdmin === 'true')
      setIsSuperAdmin(savedIsSuperAdmin === 'true')
    }
    setLoading(false)
  }, [])

  const login = (userData, admin = false) => {
    setUser(userData)
    const adminStatus = admin || (userData.Rol === 'Admin' || userData.Rol === 'SUPERADMIN')
    const superAdminStatus = userData.Rol === 'SUPERADMIN'
    setIsAdmin(adminStatus)
    setIsSuperAdmin(superAdminStatus)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('isAdmin', adminStatus.toString())
    localStorage.setItem('isSuperAdmin', superAdminStatus.toString())
  }

  const logout = () => {
    setUser(null)
    setIsAdmin(false)
    setIsSuperAdmin(false)
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('isSuperAdmin')
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSuperAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

