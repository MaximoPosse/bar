import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import BarPlayeroLayout from "./Components/BarPlayeroLayout"
import BarPlayeroFooter from "./Components/BarPlayeroFooter"
import AdminPanel from "./Components/Admin/AdminPanel"
import { CartProvider } from "./Context/CartContext"
import { AuthProvider, useAuth } from "./Context/AuthContext"

function ProtectedRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={
        <>
          <BarPlayeroLayout />
          <BarPlayeroFooter />
        </>
      } />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
