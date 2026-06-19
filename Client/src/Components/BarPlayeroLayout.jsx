import './BarPlayeroStyles.css'
import DrinkCard from './Bebidas/DrinkCard'
import Cart from './Cart/Cart'
import CartButton from './Cart/CartButton'
import PromotionCarousel from './Promotions/PromotionCarousel'
import Login from './Login/Login'
import ReservationForm from './Reservation/ReservationForm'
import { useCart } from '../Context/CartContext'
import { useAuth } from '../Context/AuthContext'
import { Link } from 'react-router-dom'
import Logo from '../assets/logo.svg'
import axios from "axios"
import { useState, useEffect } from 'react'

function BarPlayeroLayout() {
  const { addToCart, clearCart, updateQuantity } = useCart()
  const { user, isAdmin, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showReservation, setShowReservation] = useState(false)
  // Datos de productos con stock
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [cartMsg, setCartMsg] = useState(null)
  
  // Mostrar mensaje de cart
  useEffect(() => {
    if (cartMsg) {
      const timer = setTimeout(() => setCartMsg(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [cartMsg])
  // Cargar productos
  useEffect(() => {
    axios.get("http://localhost:3000/api/obtenerproductos")
      .then(res => {
        const lista = res.data.map(p => ({
          id: p.Id,
          title: p.Nombre,
          image: "data:image/png;base64," + p.Imagen,
          price: "$" + p.Precio,
          description: p.Descripcion,
          stock: p.Stock,
          raw: p
        }));
        setProducts(lista);
      });
  }, []);
  // Cargar promos
  useEffect(() => {
    axios.get("http://localhost:3000/api/obtenerpromos")
      .then(res => {
        const lista = res.data.map(p => ({
          title: p.Nombre,
          image: "data:image/png;base64," + p.Imagen,
          description: p.Descripcion,
          newPrice: "$" + p.Precio,
        }));
        setPromotions(lista);
      });
  }, []);
  useEffect(() => {
    if (!user || !user.Id)
      return
    axios.post('http://localhost:3000/api/obtenercarrito', { ID_Cliente: user.Id })
      .then(res => {
        const serverItems = res.data || []
        clearCart()
        serverItems.forEach(item => {
          const productFromServer = {
            title: item.ProductoNombre || `Producto ${item.ID_Producto}`,
            image: item.ProductoImagen ? `data:image/png;base64,${item.ProductoImagen}` : '',
            price: "$" + (item.ProductoPrecio ?? "0"),
            description: item.ProductoDescripcion ?? '',
            stock: item.Stock ?? 9999,
            raw: { ID: item.ID_Producto }
          }
          // Añadimos una vez y luego seteamos la cantidad real
          addToCart(productFromServer)
          // updateQuantity espera el título (coincide con lo que usamos arriba)
          if (item.Cantidad > 1) {
            updateQuantity(productFromServer.title, item.Cantidad)
          }
        })
      })
  }, [user]); // corre cuando user cambie

  const handleAddToCart = async (product) => {
    if (!user || !user.Id) {
      setCartMsg('Debes iniciar sesión para agregar productos al carrito')
      setTimeout(() => setCartMsg(null), 3000)
      setShowLogin(true)
      return
    }
    
    try {
      await axios.post('http://localhost:3000/api/anadirprodcarrito', {
        ID_Cliente: user.Id,
        ID_Producto: product.raw?.ID ?? product.raw?.id ?? null
      })
      setCartMsg('Producto añadido al carrito')
      setTimeout(() => setCartMsg(null), 2000)
      addToCart(product)
    } catch (err) {
      console.error("Error añadiendo producto al carrito en servidor:", err)
      setCartMsg('Error al agregar producto')
      setTimeout(() => setCartMsg(null), 2500)
    }
  }

  const handleReserveTable = () => {
    if (!user || !user.Id) {
      setCartMsg('Debes iniciar sesión para reservar una mesa')
      setTimeout(() => setCartMsg(null), 3000)
      setShowLogin(true)
      return
    }
    setShowReservation(true)
  }

  return (
    <div className="layout">
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
      {showReservation && <ReservationForm onClose={() => setShowReservation(false)} />}
      <Cart onShowLogin={() => setShowLogin(true)} />

      <header className="encabezado">
        <img src={Logo} alt="Cáliz Logo" className="logo-image" />
        <nav className="menu">
          <a href="#">Cocteles</a>
          <a href="#">Cervezas</a>
          <a href="#">Bebidas</a>
          <a href="#">Contacto</a>
          <button className="reserve-btn" onClick={handleReserveTable}>
            Reservar Mesa
          </button>
          <CartButton onShowLogin={() => setShowLogin(true)} />
        </nav>
        <div className="user-actions">
          {user ? (
            <>
              <span className="user-name">Hola, {user.Nombre}</span>
              {isAdmin && (
                <Link to="/admin" className="admin-link">Admin</Link>
              )}
              <button className="logout-btn" onClick={logout}>Cerrar Sesión</button>
            </>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      <section className="intermedio">
        <div className="hero-banner">
          <div className="hero-sub">Taberna Medieval de Autor</div>
          <h2>BIENVENIDOS AL <span>CÁLIZ</span></h2>
          <div className="hero-divider"></div>
          <p>Donde los antiguos sabores cobran vida entre muros de piedra y velas</p>
          <div className="hero-info">
            <p>Una taberna medieval en el corazón del reino, donde chaque brindis es una leyenda</p>
            <p>Hidromiel, cervezas artesanales y espirituosos cuidadosamente seleccionados</p>
          </div>
          <div className="hero-buttons">
            <button 
              className="hero-menu-btn"
              onClick={() => {
                const menuSection = document.getElementById('menu-section');
                if (menuSection) {
                  menuSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Ver Menú
            </button>
            <button 
              className="hero-know-more-btn"
              onClick={() => {
                const aboutSection = document.getElementById('about-section');
                if (aboutSection) {
                  aboutSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Conocer Más
            </button>
          </div>
        </div>
      </section>

      <PromotionCarousel promotions={promotions} />

      {/* Sección Promos 2x1 */}
      <section className="promos-2x1-section" id="promos-2x1-section">
        <div className="promos-2x1-container">
          <h2 className="promos-2x1-title">PROMOCIONES 2x1</h2>
          <div className="promos-2x1-carousel">
            {promotions.map((promo, index) => (
              <div key={index} className="promo-2x1-card">
                <img src={promo.image} alt={promo.title} className="promo-2x1-image" />
                <div className="promo-2x1-content">
                  <h3>{promo.title}</h3>
                  <p>{promo.description}</p>
                  <span className="promo-2x1-price">{promo.newPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="contenido" id="menu-section">
        <h2 className="products-title">NUESTRO MENÚ</h2>
        {cartMsg && (
          <div style={{
            padding: '15px',
            margin: '20px auto',
            maxWidth: '600px',
            background: '#1a1a1a',
            border: '2px solid #ffffff',
            borderRadius: '8px',
            color: '#ffffff',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {cartMsg}
          </div>
        )}
        <div className="cards">
          {products.map(product => (
            <DrinkCard
              key={product.title + (product.raw?.ID ?? '')}
              title={product.title}
              image={product.image}
              price={product.price}
              description={product.description}
              stock={product.stock}
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </div>
      </main>

      {/* Sección Sobre Nosotros */}
      <section className="about-section" id="about-section">
        <div className="about-container">
          <h2 className="about-title">SOBRE EL CÁLIZ</h2>
          <div className="about-content">
            <div className="about-card">
                <h3>Nuestro Propósito</h3>
                <p>
                  En El Cáliz, nuestro propósito es ofrecer experiencias medievales auténticas e inolvidables para nuestros comensales.
                  Nos enfocamos en hidromiel artesanal, licores de autor y un ambiente de taberna que transporta a otra época.
                  Buscamos crear momentos memorables combinando tradición, calidad y hospitalidad de antaño.
                </p>
            </div>
            <div className="about-card">
              <h3>Nuestra Leyenda</h3>
              <p>
                El Cáliz nació con la visión de crear un espacio donde la tradición medieval y la coctelería de autor
                sean el centro de la experiencia. Inspirados en las antiguas tabernas del viejo continente, combinamos
                ingredientes ancestrales, recetas olvidadas y un servicio digno de reyes para ofrecer propuestas
                que sorprenden a cada visitante. Nos esforzamos por superar expectativas y consolidar una experiencia
                legendaria en el reino.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Ambiente Único */}
      <section className="info-section">
        <div className="info-container">
          <h3>AMBIENTE MEDIEVAL</h3>
          <div className="ambience-gallery">
            <img src="/bartender-preparing-cocktail-with-professional-tec.jpg" alt="Tabernero preparando hidromiel" className="ambience-image" />
            <img src="/cozy-bar-lounge-seating-area-with-warm-lighting.jpg" alt="Salón de la taberna con iluminación de velas" className="ambience-image" />
            <img src="/elegant-bar-counter-with-premium-bottles-backlit.jpg" alt="Barra de roble con destilados" className="ambience-image" />
            <img src="/elegant-dark-bar-interior-with-bottles-and-mood-li.jpg" alt="Interior de la taberna medieval" className="ambience-image" />
          </div>
        </div>
      </section>

      {/* Sección Contacto */}
      <section className="contact-section">
        <div className="contact-container">
          <h3 className="contact-title">CONTACTO</h3>
          <form className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre del Huésped</label>
                <input type="text" id="nombre" name="nombre" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="asunto">Asunto del Mensaje</label>
              <input type="text" id="asunto" name="asunto" required />
            </div>
            <div className="form-group">
              <label htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" name="mensaje" rows="5" required></textarea>
            </div>
            <button type="submit" className="contact-submit">Enviar Mensaje por Cuervo</button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default BarPlayeroLayout

