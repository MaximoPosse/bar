import { useState, useEffect } from 'react'
import axios from 'axios'
import './AdminPanel.css'

function PedidosSection({ onAction }) {
  const [pedidos, setPedidos] = useState([])
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // nuevo estado para el carrito del cliente cuando abrimos detalles
  const [carrito, setCarrito] = useState([])
  const [loadingCarrito, setLoadingCarrito] = useState(false)
  const [carritoError, setCarritoError] = useState('')

  useEffect(() => {
    cargarPedidos()
  }, [])

  const cargarPedidos = async () => {
    setError('')
    try {
      const resp = await axios.get('https://bar-caliz-backend.onrender.com/api/obtenerpedidos')
      setPedidos(resp.data || [])
    } catch (err) {
      console.error('Error al cargar pedidos', err)
      setError('Error al cargar pedidos')
      setPedidos([])
    }
  }

  const ensureDataUrl = (maybeBase64) => {
    if (!maybeBase64) return null
    if (maybeBase64.startsWith && maybeBase64.startsWith('data:')) return maybeBase64
    return `data:image/png;base64,${maybeBase64}`
  }

  // Nuevo: cargar carrito del cliente para mostrar en detalles
  const cargarCarritoCliente = async (idCliente) => {
    setCarritoError('')
    setLoadingCarrito(true)
    setCarrito([])
    try {
      const resp = await axios.post('https://bar-caliz-backend.onrender.com/api/obtenercarrito', { ID_Cliente: idCliente })
      const items = (resp.data || []).map(item => {
        // el backend devuelve ProductoImagen o PromoImagen en base64 segun ID_Promo === -1
        const imageBase64 = item.ID_Promo === -1 ? item.ProductoImagen : item.PromoImagen
        const image = imageBase64 ? ensureDataUrl(imageBase64) : null
        // determinar nombre y precio a mostrar
        const nombre = item.ID_Promo === -1 ? (item.ProductoNombre || '—') : (item.PromoNombre || '—')
        const precio = item.ID_Promo === -1 ? item.ProductoPrecio : item.PromoPrecio
        return {
          ...item,
          _imageUrl: image,
          _displayNombre: nombre,
          _displayPrecio: precio != null ? Number(precio) : null,
          Cantidad: Number(item.Cantidad) || 1
        }
      })
      setCarrito(items)
    } catch (err) {
      console.error('Error al cargar carrito del cliente', err)
      setCarritoError(err.response?.data?.Error || 'Error al cargar carrito')
      setCarrito([])
    } finally {
      setLoadingCarrito(false)
    }
  }

  const handleView = async (pedido) => {
    setSelectedPedido(pedido)
    setShowDetails(true)
    setError('')
    setSuccess('')
    // cargar carrito del cliente del pedido
    if (pedido && pedido.ID_Cliente) {
      await cargarCarritoCliente(pedido.ID_Cliente)
    } else {
      setCarrito([])
    }
  }

  const handleCloseDetails = () => {
    setSelectedPedido(null)
    setShowDetails(false)
    setCarrito([])
    setCarritoError('')
  }

  const handleDelete = async (id) => {
    if(!window.confirm('¿Estás seguro de eliminar este pedido?'))
      return
    try
    {
      await axios.post('https://bar-caliz-backend.onrender.com/api/procesarpedido', { ID_Pedido: id });
      setSuccess('Pedido eliminado exitosamente');
      await cargarPedidos()
      if (onAction) onAction()
      setTimeout(() => setSuccess(''), 3000)
    }
    catch(err)
    {
      console.error('Error al eliminar pedido', err)
      setError(err.response?.data?.Error || 'Error al eliminar pedido')
    }
  }

  const renderTabla = () => (
    <table className="products-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Monto</th>
          <th>Cliente</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {pedidos.map((p) => (
          <tr key={p.ID}>
            <td>{p.ID}</td>
            <td>{p.Fecha}</td>
            <td>{p.Hora}</td>
            <td>${p.Monto_Total}</td>
            <td>{p.ClienteNombre || p.Nombre || p.Cliente || '—'}</td>
            <td>
              <button className="btn-edit" onClick={() => handleView(p)}>Ver</button>
              <button className="btn-delete" onClick={() => handleDelete(p.ID)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  function miniCarrito() {
    if (loadingCarrito) return <div style={{ padding: 12, color: '#fff' }}>Cargando carrito...</div>
    if (carritoError) return <div style={{ padding: 12, color: '#ffb3b3' }}>{carritoError}</div>
    if (!carrito || carrito.length === 0) return <div style={{ padding: 12, color: 'rgba(255,255,255,0.85)' }}>No hay items en el carrito.</div>

    const totalCalc = carrito.reduce((acc, it) => {
      const precio = it._displayPrecio != null ? Number(it._displayPrecio) : 0
      return acc + precio * (Number(it.Cantidad) || 1)
    }, 0)

    return (
      <div style={{ marginTop: 12 }}>
        <table className="products-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Precio u.</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {carrito.map(item => (
              <tr key={`${item.ID_Carrito || item.ID_Producto || item.ID_Promo}-${item.ID_Carrito || ''}`}>
                <td style={{ padding: 8 }}>
                  {item._imageUrl
                    ? <img src={item._imageUrl} alt={item._displayNombre} className="product-thumb" />
                    : <div style={{ width: 60, height: 60, background: '#222', borderRadius: 8 }} />}
                </td>
                <td style={{ padding: 8 }}>{item._displayNombre}</td>
                <td style={{ padding: 8 }}>{item._displayPrecio != null ? `$${item._displayPrecio}` : '—'}</td>
                <td style={{ padding: 8 }}>{item.Cantidad}</td>
                <td style={{ padding: 8 }}>
                  {item._displayPrecio != null ? `$${(item._displayPrecio * (Number(item.Cantidad) || 1)).toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: 8 }}>{item.ID_Promo === -1 ? 'Producto' : 'Promo'}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', padding: 8, fontWeight: 'bold', color: '#fff' }}>Total calculado:</td>
              <td style={{ padding: 8, fontWeight: 'bold' }}>${totalCalc.toFixed(2)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="products-section">
      {error && <div className="admin-message error">{error}</div>}
      {success && <div className="admin-message success">{success}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, color: '#fff' }}>Pedidos</h2>
      </div>

      <div className="products-table-container" style={{ marginTop: 12 }}>
        {pedidos.length === 0 ? (
          <div style={{ padding: 18, color: 'rgba(255,255,255,0.85)' }}>No hay pedidos para mostrar.</div>
        ) : (
          renderTabla()
        )}
      </div>

      {showDetails && selectedPedido && (
        <div className="admin-form-container" style={{ position: 'fixed', inset: '10vh 10vw', zIndex: 3000, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Detalle del Pedido #{selectedPedido.ID}</h3>
            <button className="btn-cancel" onClick={handleCloseDetails}>Cerrar</button>
          </div>

          <div style={{ marginTop: 12, color: '#fff' }}>
            <p><strong>Cliente:</strong> {selectedPedido.ClienteNombre || selectedPedido.Nombre || '—'}</p>
            <p><strong>Fecha:</strong> {selectedPedido.Fecha}</p>
            <p><strong>Hora:</strong> {selectedPedido.Hora}</p>
            <p><strong>Monto total (registro):</strong> ${selectedPedido.Monto_Total}</p>
            <p><strong>ID cliente:</strong> {selectedPedido.ID_Cliente}</p>

            <h4 style={{ marginTop: 12, color: '#fff' }}>Carrito del cliente</h4>
            {miniCarrito()}
          </div>
        </div>
      )}
    </div>
  )
}

export default PedidosSection
