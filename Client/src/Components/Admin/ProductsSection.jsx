import { useState, useEffect } from 'react'
import axios from 'axios'
import './AdminPanel.css'

function ProductsSection({ onAction }) {
    const [products, setProducts] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState({
        Nombre: '',
        Precio: '',
        Stock: '',
        Descripcion: '',
        Imagen: null,
        ID_Promo: -1
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [imagePreview, setImagePreview] = useState(null)
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const resp = await axios.get('http://localhost:3000/api/obtenerproductos')
            const lista = resp.data.map(p => ({ ...p, Imagen: p.Imagen ? 'data:image/png;base64,' + p.Imagen : null }))
            setProducts(lista)
        } catch (err) {
            setError('Error al cargar productos')
            console.error(err)
        }
    }

    const resetForm = () => {
        setShowForm(false)
        setFormData({ Nombre: '', Precio: '', Stock: '', Descripcion: '', Imagen: null, ID_Promo: -1 })
        setEditingProduct(null)
        setImagePreview(null)
        setError('')
    }

    const handleChange = (e) => {
        if (e.target.name === 'Imagen') {
            const file = e.target.files[0]
            setFormData({ ...formData, Imagen: file })
            if (file) {
                const reader = new FileReader()
                reader.onloadend = () => setImagePreview(reader.result)
                reader.readAsDataURL(file)
            } else setImagePreview(null)
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value })
        }
        setError('')
        setSuccess('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!formData.Nombre || !formData.Precio || !formData.Stock || !formData.Descripcion) {
            setError('Todos los campos son obligatorios')
            return
        }

        if (!editingProduct && !formData.Imagen) {
            setError('La imagen es obligatoria para nuevos productos')
            return
        }

        try {
            const fd = new FormData()
            fd.append('Nombre', formData.Nombre)
            fd.append('Precio', formData.Precio)
            fd.append('Stock', formData.Stock)
            fd.append('Descripcion', formData.Descripcion)
            fd.append('ID_Promo', formData.ID_Promo || -1)
            if (formData.Imagen) fd.append('Imagen', formData.Imagen)
            if (editingProduct) {
                fd.append('ID', editingProduct.ID)
                await axios.post('http://localhost:3000/api/modificarproducto', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setSuccess('Producto modificado exitosamente')
            } else {
                await axios.post('http://localhost:3000/api/anadirproducto', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setSuccess('Producto añadido exitosamente')
            }

            resetForm()
            loadProducts()
            if (onAction) onAction()
            setTimeout(() => setSuccess(''), 3000)
            setShowForm(false)
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.Error || 'Error al guardar producto')
        }
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setShowForm(true);
        setFormData({
            Nombre: product.Nombre,
            Precio: product.Precio,
            Stock: product.Stock,
            Descripcion: product.Descripcion,
            Imagen: null,
            ID_Promo: product.ID_Promo || -1
        })
        setImagePreview(product.Imagen)
        setError('')
    }

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return
        try {
            await axios.post('http://localhost:3000/api/eliminarproducto', { ID: id })
            setSuccess('Producto eliminado exitosamente')
            loadProducts()
            if (onAction) onAction()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.Error || 'Error al eliminar producto')
        }
    }

    return (
        <div className="products-section">
            {error && <div className="admin-message error">{error}</div>}
            {success && <div className="admin-message success">{success}</div>}
            <div>
                <button className="btn-add" onClick={() => {
                    setShowForm(true);
                    setEditingProduct(null)
                }}>
                    Agregar Producto
                </button>
            </div>
            {showForm && (<div className="admin-form-container">
                <div className="admin-form">
                    <h2>{editingProduct ? 'Modificar Producto' : 'Nuevo Producto'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nombre:</label>
                            <input type="text" name="Nombre" value={formData.Nombre} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Precio:</label>
                            <input type="number" name="Precio" step="0.01" value={formData.Precio} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Stock:</label>
                            <input type="number" name="Stock" value={formData.Stock} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Descripción:</label>
                            <textarea name="Descripcion" value={formData.Descripcion} onChange={handleChange} required rows="4" />
                        </div>
                        {imagePreview && (
                            <div className="image-preview-container">
                                <img src={imagePreview} alt="Vista previa" className="image-preview" />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Imagen {editingProduct && '(opcional)'}:</label>
                            <input type="file" name="Imagen" accept="image/*" onChange={handleChange} required={!editingProduct} />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-save">{editingProduct ? 'Modificar' : 'Añadir'}</button>
                            <button type="button" className="btn-cancel" onClick={resetForm}>Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
            )}

            <div className="products-table-container">
                <h2>Productos</h2>
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.ID}>
                                <td>{product.ID}</td>
                                <td>
                                    {product.Imagen ? <img src={product.Imagen} alt={product.Nombre} className="product-thumb" /> : <div style={{ width: 60, height: 60, background: '#222', borderRadius: 8 }} />}
                                </td>
                                <td>{product.Nombre}</td>
                                <td>${product.Precio}</td>
                                <td>{product.Stock}</td>
                                <td className="description-cell">{product.Descripcion}</td>
                                <td>
                                    <button className="btn-edit" onClick={() => handleEdit(product)}>Editar</button>
                                    <button className="btn-delete" onClick={() => handleDelete(product.ID)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ProductsSection