import { createContext, useContext, useState } from 'react'
import axios from "axios"
import { useAuth } from '../Context/AuthContext'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, _setIsCartOpen] = useState(false)
  const {user} = useAuth();

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.title === product.title)

      if (existingItem) {
        // Si el producto ya está en el carrito, aumentar la cantidad
        if (existingItem.quantity < existingItem.stock) {
          return prevItems.map((item) =>
            item.title === product.title
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
        return prevItems
      } else {
        // Si es un producto nuevo, agregarlo al carrito
        return [...prevItems, { ...product, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (title) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.title !== title))
  }

  const updateQuantity = (title, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.title === title
          ? { ...item, quantity: Math.max(0, Math.min(newQuantity, item.stock)) }
          : item
      )
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace('$', ''))
      return total + price * item.quantity
    }, 0)
  }

  async function setIsCartOpen(value) {
    if (value == true)
      await ActualizarCarrito()
    _setIsCartOpen(value)
  }

  async function ActualizarCarrito() {
    await axios.post("https://bar-caliz-backend.onrender.com/api/actualizarcarrito", {
      ID_Cliente: user.Id
    })
    const res = await axios.post('https://bar-caliz-backend.onrender.com/api/obtenercarrito', { ID_Cliente: user.Id })
    const serverItems = res.data || []
    clearCart()
    serverItems.forEach(item => {
      let productFromServer = {}
      if (item.ProductoNombre) {
        productFromServer = {
          title: item.ProductoNombre || `Producto ${item.ID_Producto}`,
          image: item.ProductoImagen ? `data:image/png;base64,${item.ProductoImagen}` : '',
          price: "$" + (item.ProductoPrecio ?? "0"),
          description: item.ProductoDescripcion ?? '',
          stock: item.Stock ?? 9999,
          raw: { ID: item.ID_Producto },
          isPromo: false
        }
      }
      else {
        productFromServer = {
          title: item.PromoNombre,
          image: item.PromoImagen ? `data:image/png;base64,${item.PromoImagen}` : '',
          price: "$" + (item.PromoPrecio ?? "0"),
          description: item.PromoDescripcion ?? '',
          stock: item.Stock ?? 9999,
          raw: { ID: item.ID_Promo },
          isPromo: true
        }
      }
      // Añadimos una vez y luego seteamos la cantidad real
      addToCart(productFromServer)
      // updateQuantity espera el título (coincide con lo que usamos arriba)
      if (item.Cantidad > 1) {
        updateQuantity(productFromServer.title, item.Cantidad)
      }
    })
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

