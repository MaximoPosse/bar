function DrinkCard({ title, image, price, description, stock, onAddToCart }) {
  const isOutOfStock = stock === 0;
  
  return (
    <article className="card">
      <img className="card-image" src={image} alt={title} />
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
        <div className="card-info">
          <p className="card-price">{price}</p>
          <p className={`card-stock ${isOutOfStock ? 'out-of-stock' : ''}`}>
            Stock: {stock}
          </p>
        </div>
        <button 
          className={`btn ${isOutOfStock ? 'btn-disabled' : ''}`}
          onClick={() => !isOutOfStock && onAddToCart && onAddToCart()}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Sin Stock' : 'Agregar al Carrito'}
        </button>
      </div>
    </article>
  )
}

export default DrinkCard