import { useState, useEffect } from 'react'
import './PromotionCarousel.css'

function PromotionCarousel({ promotions }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % promotions.length)
    }, 5000) // Cambia cada 5 segundos

    return () => clearInterval(interval)
  }, [promotions.length])

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? promotions.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === promotions.length - 1 ? 0 : prevIndex + 1
    )
  }

  return (
    <section className="promotion-section">
      <h2 className="promotion-title">PROMOCIONES ESPECIALES</h2>
      <div className="carousel-container">
        <button className="carousel-btn carousel-btn-prev" onClick={goToPrevious}>
          ‹
        </button>
        <div className="carousel-wrapper">
          <div 
            className="carousel-slides"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {promotions.map((promo, index) => (
              <div key={index} className="carousel-slide">
                <div className="promotion-card">
                  <div className="promotion-badge">PROMO</div>
                  <img 
                    src={promo.image} 
                    alt={promo.title} 
                    className="promotion-image"
                  />
                  <div className="promotion-content">
                    <h3 className="promotion-card-title">{promo.title}</h3>
                    <p className="promotion-description">{promo.description}</p>
                    <div className="promotion-price">
                      <span className="promotion-old-price">{promo.oldPrice}</span>
                      <span className="promotion-new-price">{promo.newPrice}</span>
                    </div>
                    <span className="promotion-discount">{promo.discount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="carousel-btn carousel-btn-next" onClick={goToNext}>
          ›
        </button>
      </div>
      <div className="carousel-indicators">
        {promotions.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir a promoción ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

export default PromotionCarousel

