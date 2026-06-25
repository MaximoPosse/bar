import { useCart } from '../../Context/CartContext'
import { useAuth } from '../../Context/AuthContext'
import axios from 'axios'
import { useState } from 'react'
import './Cart.css'

function Cart({ onShowLogin }) {
  const {
    cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
    getTotalPrice, isCartOpen, setIsCartOpen,
  } = useCart()

  const { user } = useAuth()
  const [checkoutMsg, setCheckoutMsg] = useState(null)
  const getUserId = () => user?.Id || user?.ID || null

  if (!isCartOpen) return null

  const apiCall = async (endpoint, data) => {
    const uid = getUserId()
    if (!uid) throw new Error('No user')
    return axios.post(`http://localhost:3000/api/${endpoint}`, { ...data, ID_Cliente: uid })
  }

  const handleIncrease = async (item) => {
    const uid = getUserId()
    if (!uid) { setCheckoutMsg('Debes iniciar sesión'); setTimeout(() => setCheckoutMsg(null), 3000); if (onShowLogin) onShowLogin(); return }
    try {
      if (item.isPromo) {
        await apiCall('anadirpromcarrito', { ID_Promo: item.promoID || item.raw?.ID })
      } else {
        await apiCall('anadirprodcarrito', { ID_Producto: item.raw?.ID ?? item.raw?.id ?? null })
      }
      updateQuantity(item.title, item.quantity + 1)
    } catch (err) {
      console.error(err)
      updateQuantity(item.title, item.quantity + 1)
    }
  }

  const handleDecrease = async (item) => {
    const uid = getUserId()
    if (!uid) { setCheckoutMsg('Debes iniciar sesión'); setTimeout(() => setCheckoutMsg(null), 3000); if (onShowLogin) onShowLogin(); return }
    try {
      if (item.isPromo) {
        await apiCall('eliminarpromcarrito', { ID_Promo: item.promoID || item.raw?.ID })
      } else {
        await apiCall('eliminarprodcarrito', { ID_Producto: item.raw?.ID ?? item.raw?.id ?? null })
      }
      if (item.quantity > 1) updateQuantity(item.title, item.quantity - 1)
      else removeFromCart(item.title)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemove = async (item) => {
    const uid = getUserId()
    if (!uid) return
    try {
      if (item.isPromo) {
        await apiCall('eliminarpromcarrito', { ID_Promo: item.promoID || item.raw?.ID, Eliminar: true })
      } else {
        await apiCall('eliminarprodcarrito', { ID_Producto: item.raw?.ID ?? item.raw?.id ?? null, Eliminar: true })
      }
      removeFromCart(item.title)
    } catch (err) {
      console.error(err)
      removeFromCart(item.title)
    }
  }

  const handleClearCart = async () => {
    const uid = getUserId()
    if (!uid) return
    try { await apiCall('vaciarcarrito', {}) } catch (e) { console.error(e) }
    clearCart()
  }

  const handleCheckout = async () => {
    const uid = getUserId()
    if (!uid) { setCheckoutMsg('Debes iniciar sesión'); setTimeout(() => setCheckoutMsg(null), 3000); if (onShowLogin) onShowLogin(); return }
    if (cartItems.length === 0) { setCheckoutMsg('Tu carrito está vacío'); setTimeout(() => setCheckoutMsg(null), 2000); return }
    setCheckoutMsg('¡Compra realizada con éxito!')
    setTimeout(() => { setCheckoutMsg(null); clearCart(); setIsCartOpen(false) }, 2000)
  }

  const calcItemPrice = (item) => {
    const unitPrice = parseFloat(item.price?.replace('$', '') || '0')
    if (item.isPromo) {
      const paid = Math.ceil(item.quantity / 2)
      return unitPrice * paid
    }
    return unitPrice * item.quantity
  }

  const calcTotal = () => {
    return cartItems.reduce((sum, item) => sum + calcItemPrice(item), 0)
  }

  return (
    <>
      <div className="cart-overlay" onClick={() => setIsCartOpen(false)}></div>
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>Carrito de Compras</h2>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>&times;</button>
        </div>
        <div className="cart-content">
          {checkoutMsg && (
            <div className="cart-message" style={{
              padding: '12px', marginBottom: '15px', background: 'var(--caliz-brown)',
              border: '2px solid var(--caliz-bronze)', borderRadius: '8px',
              color: 'var(--caliz-cream)', textAlign: 'center', fontSize: '14px'
            }}>
              {checkoutMsg}
            </div>
          )}
          {cartItems.length === 0 ? (
            <div className="cart-empty"><p>Tu carrito está vacío</p></div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.title} className="cart-item">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="cart-item-image" />
                    ) : (
                      <div className="cart-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--caliz-dark)', fontSize: 28 }}>🏷</div>
                    )}
                    <div className="cart-item-info">
                      <h4>{item.title}{item.isPromo && <span style={{ color: 'var(--caliz-green)', fontSize: 11, marginLeft: 6 }}>PROMO</span>}</h4>
                      <p className="cart-item-price">${calcItemPrice(item).toFixed(2)}</p>
                      {item.isPromo && item.quantity >= 2 && (
                        <p style={{ color: 'var(--caliz-green)', fontSize: 12, margin: 0 }}>
                          2x1: {Math.floor(item.quantity / 2)} gratis
                        </p>
                      )}
                      <div className="cart-item-controls">
                        <button onClick={() => handleDecrease(item)} disabled={item.quantity <= 1} className="quantity-btn">&minus;</button>
                        <span className="quantity">{item.quantity}</span>
                        <button onClick={() => handleIncrease(item)} disabled={item.quantity >= item.stock} className="quantity-btn">+</button>
                        <button onClick={() => handleRemove(item)} className="remove-btn">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <div className="cart-total">
                  <strong>Total: ${calcTotal().toFixed(2)}</strong>
                </div>
                <div className="cart-actions">
                  <button onClick={handleClearCart} className="btn-clear">Vaciar Carrito</button>
                  <button onClick={handleCheckout} className="btn-checkout">Finalizar Compra</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Cart
