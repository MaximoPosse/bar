import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../Context/AuthContext'
import './AdminPanel.css'
import ProductsSection from './ProductsSection'
import PromosSection from './PromosSection'
import PedidosSection from './PedidosSection'

function AdminPanel() {
  const { user, isSuperAdmin } = useAuth()
  const [showAdminsSection, setShowAdminsSection] = useState(false)
  const [showProducts, setShowProducts] = useState(true)
  const [showPromos, setShowPromos] = useState(false)
  const [admins, setAdmins] = useState([])
  const [adminMsg, setAdminMsg] = useState(null)
  const [newAdmin, setNewAdmin] = useState({ Nombre: '', Correo: '', Contraseña: '' })

  const onSectionAction = () => {}

  const loadAdmins = async () => {
    try {
      const res = await axios.get('https://bar-caliz-backend.onrender.com/api/obteneradmins')
      setAdmins(res.data || [])
    } catch {
      setAdminMsg({ type: 'error', text: 'Error al cargar administradores' })
    }
  }

  useEffect(() => {
    if (showAdminsSection && isSuperAdmin) loadAdmins()
  }, [showAdminsSection, isSuperAdmin])

  const handleRegisterAdmin = async (e) => {
    e.preventDefault()
    setAdminMsg(null)
    if (!newAdmin.Nombre || !newAdmin.Correo || !newAdmin.Contraseña) {
      setAdminMsg({ type: 'error', text: 'Todos los campos son obligatorios' })
      return
    }
    if (newAdmin.Contraseña.length < 6) {
      setAdminMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }
    try {
      await axios.post('https://bar-caliz-backend.onrender.com/api/registrarseadmin', {
        Nombre: newAdmin.Nombre, Correo: newAdmin.Correo, Contraseña: newAdmin.Contraseña
      })
      setAdminMsg({ type: 'success', text: `Admin "${newAdmin.Nombre}" registrado exitosamente` })
      setNewAdmin({ Nombre: '', Correo: '', Contraseña: '' })
      loadAdmins()
    } catch (err) {
      setAdminMsg({ type: 'error', text: err.response?.data?.Error || 'Error al registrar admin' })
    }
  }

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`¿Eliminar al administrador "${admin.Nombre}"?`)) return
    try {
      await axios.post('https://bar-caliz-backend.onrender.com/api/eliminaradmin', {
        ID: admin.ID, ID_Usuario: user?.ID
      })
      setAdminMsg({ type: 'success', text: `Admin "${admin.Nombre}" eliminado` })
      loadAdmins()
    } catch (err) {
      setAdminMsg({ type: 'error', text: err.response?.data?.Error || 'Error al eliminar admin' })
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <div className="header-actions">
          {isSuperAdmin && (
            <button className={`btn-toggle ${showAdminsSection ? 'active' : ''}`} onClick={() => setShowAdminsSection(!showAdminsSection)}>
              {showAdminsSection ? 'Ocultar' : 'Gestionar'} Admins
            </button>
          )}
          <button className={`btn-toggle ${showProducts ? 'active' : ''}`} onClick={() => { setShowProducts(true); setShowPromos(false) }}>
            Productos
          </button>
          <button className={`btn-toggle ${showPromos ? 'active' : ''}`} onClick={() => { setShowPromos(true); setShowProducts(false) }}>
            Promos
          </button>
          <button className={`btn-toggle ${showPedidos ? 'active' : ''}`} onClick={() => { setShowPedidos(true); setShowPromos(false); setShowProducts(false); setShowMesas(false) }}>
            Pedidos
          </button>
        </div>
      </div>

      {showAdminsSection && isSuperAdmin && (
        <div className="admins-section">
          <h2>Gestión de Administradores</h2>

          {adminMsg && (
            <div className={`admin-message ${adminMsg.type}`}>{adminMsg.text}</div>
          )}

          <div className="admin-form-container">
            <h2>Registrar Nuevo Admin</h2>
            <form className="admin-form" onSubmit={handleRegisterAdmin}>
              <div className="form-group">
                <label>Nombre de usuario</label>
                <input type="text" value={newAdmin.Nombre} onChange={e => setNewAdmin({ ...newAdmin, Nombre: e.target.value })} placeholder="Nombre del admin" required />
              </div>
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" value={newAdmin.Correo} onChange={e => setNewAdmin({ ...newAdmin, Correo: e.target.value })} placeholder="correo@ejemplo.com" required />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" value={newAdmin.Contraseña} onChange={e => setNewAdmin({ ...newAdmin, Contraseña: e.target.value })} placeholder="Mín. 6 caracteres" required />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">Registrar Admin</button>
              </div>
            </form>
          </div>

          <div className="products-table-container">
            <h2>Administradores Registrados ({admins.length})</h2>
            <table className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.ID}>
                    <td>{a.ID}</td>
                    <td>{a.Nombre}</td>
                    <td>{a.Correo}</td>
                    <td>
                      <span className={`role-badge ${a.Rol === 'SUPERADMIN' ? 'superadmin' : 'admin'}`}>{a.Rol}</span>
                    </td>
                    <td>
                      <button className={`btn-delete ${a.Rol === 'SUPERADMIN' ? 'btn-disabled' : ''}`}
                        disabled={a.Rol === 'SUPERADMIN'}
                        onClick={() => handleDeleteAdmin(a)}>
                        {a.Rol === 'SUPERADMIN' ? 'Protegido' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showProducts && <ProductsSection onAction={onSectionAction} />}
      {showPromos && <PromosSection onAction={onSectionAction} />}
      {showPedidos && (
        <PedidosSection onAction={onSectionAction} />
      )}
    </div>
  )
}

export default AdminPanel
