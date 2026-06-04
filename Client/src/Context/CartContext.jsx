import { createContext, useContext, useState } from 'react'

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
  const [isCartOpen, setIsCartOpen] = useState(false)

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

