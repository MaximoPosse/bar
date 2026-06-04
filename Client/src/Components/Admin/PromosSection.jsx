import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './AdminPanel.css'

function PromosSection({ onAction }) {
    const [promos, setPromos] = useState([])
    const [allProducts, setAllProducts] = useState([])
    const [editingPromo, setEditingPromo] = useState(null)
    const [editingProducts, setEditingProducts] = useState([])
    const [selectedProductToAdd, setSelectedProductToAdd] = useState('')
    const [formData, setFormData] = useState({ Nombre: '', Precio: '', Imagen: null })
    const [imagePreview, setImagePreview] = useState(null)
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadPromos()
        loadAllProducts()
    }, [])

    const loadPromos = async () => {
        try {
            const resp = await axios.get('http://localhost:3000/api/obtenerpromos')
            const lista = resp.data.map(promo => ({
                ...promo,
                Imagen: promo.Imagen ? "data:image/png;base64," + promo.Imagen : null,
            }))
            setPromos(lista)
        } catch (err) {
            console.error(err)
            setError('Error al cargar promos')
        }
    }

    const loadAllProducts = async () => {
        try {
            const resp = await axios.get('http://localhost:3000/api/obtenerproductos')
            const productos = resp.data.map(p => ({
                ID: p.ID,
                Nombre: p.Nombre,
                Imagen: p.Imagen ? "data:image/png;base64," + p.Imagen : null,
                Precio: p.Precio,
                Stock: p.Stock,
                Descripcion: p.Descripcion
            }))
            setAllProducts(productos)
        } catch (err) {
            console.warn('No se pudo cargar /api/obtenerproductos, reconstruyendo desde /api/obtenerpromos')
            const flat = []
            promos.forEach(p => {
                (p.Productos || []).forEach(prod => flat.push({
                    ID: prod.ID,
                    Nombre: prod.Nombre,
                    Imagen: prod.Imagen ? "data:image/png;base64," + prod.Imagen : null,
                    Precio: prod.Precio,
                    Stock: prod.Stock,
                    Descripcion: prod.Descripcion
                }))
            })
            // eliminar duplicados por ID
            const uniq = Object.values(flat.reduce((acc, cur) => { acc[cur.ID] = acc[cur.ID] || cur; return acc }, {}))
            setAllProducts(uniq)
        }
    }

    const resetForm = () => {
        setEditingPromo(null)
        setEditingProducts([])
        setSelectedProductToAdd('')
        setFormData({ Nombre: '', Precio: '', Imagen: null })
        setImagePreview(null)
        setError('')
        setShowForm(false)
    }

    const handleChange = (e) => {
        if (e.target.name === 'Imagen') {
            const file = e.target.files[0]
            setFormData({ ...formData, Imagen: file })
            if (file) {
                const reader = new FileReader()
                reader.onloadend = () => setImagePreview(reader.result)
                reader.readAsDataURL(file)
            }
            else
                setImagePreview(null)
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

        if (!formData.Nombre || !formData.Precio) {
            setError('Nombre y Precio son obligatorios')
            return
        }

        if (!editingPromo && !formData.Imagen) {
            setError('La imagen es obligatoria para nuevas promos')
            return
        }

        try {
            const fd = new FormData()
            fd.append('Nombre', formData.Nombre)
            fd.append('Precio', formData.Precio)
            if (formData.Imagen)
                fd.append('Imagen', formData.Imagen)
            if (editingPromo) {
                fd.append('ID', editingPromo.ID)
                const prodIDs = editingProducts.map(p => p.ID)
                fd.append('Productos', JSON.stringify(prodIDs))

                await axios.post('http://localhost:3000/api/modificarpromo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setSuccess('Promo modificada exitosamente')
            } else {
                // Nueva promo: también permitimos enviar Productos (si los hubieras agregado antes de crear)
                const prodIDs = editingProducts.map(p => p.ID)
                if (prodIDs.length) fd.append('Productos', JSON.stringify(prodIDs))

                await axios.post('http://localhost:3000/api/anadirpromo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setSuccess('Promo añadida exitosamente')
                setShowForm(false)
            }

            resetForm()
            await loadPromos()
            await loadAllProducts()
            if (onAction) onAction()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.Error || 'Error al guardar promo')
        }
    }

    const handleEdit = (promo) => {
        setEditingPromo(promo)
        setFormData({ Nombre: promo.Nombre, Precio: promo.Precio, Imagen: null })
        setImagePreview(promo.Imagen)
        // normalizamos productos asociados (por si vienen sin campos esperados)
        const prods = (promo.Productos || []).map(p => ({ ID: p.ID, Nombre: p.Nombre, Precio: p.Precio }))
        setEditingProducts(prods)
        setError('')
        setSelectedProductToAdd('')
        setShowForm(true);
    }

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta promo?')) return
        try {
            await axios.post('http://localhost:3000/api/eliminarpromo', { ID: id })
            setSuccess('Promo eliminada exitosamente')
            loadPromos()
            loadAllProducts()
            if (onAction) onAction()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.Error || 'Error al eliminar promo')
        }
    }

    // Añadir producto a la lista local de la promo en edición
    const handleAddProductToEditing = () => {
        if (!selectedProductToAdd) return
        const prod = allProducts.find(p => String(p.ID) === String(selectedProductToAdd))
        if (!prod) return
        if (editingProducts.find(p => String(p.ID) === String(prod.ID))) return
        setEditingProducts([...editingProducts, prod])
        setSelectedProductToAdd('')
    }

    // Quitar producto localmente
    const handleRemoveProductFromEditing = (id) => {
        setEditingProducts(editingProducts.filter(p => String(p.ID) !== String(id)))
    }

    // helper: productos disponibles para agregar (todos menos los que ya están en editing)
    const availableProductsForAdd = allProducts.filter(p => !editingProducts.find(ep => String(ep.ID) === String(p.ID)))

    return (
        <div className="promos-section">
            {error && <div className="admin-message error">{error}</div>}
            {success && <div className="admin-message success">{success}</div>}
            <div>
                <button className="btn-add" onClick={() => {
                    setShowForm(true);
                    setEditingPromo(null);
                    setEditingProducts([]);
                }}>
                    Agregar Producto
                </button>
            </div>
            {showForm && (<div className="admin-form-container">
                <div className="admin-form">
                    <h2>{editingPromo ? 'Modificar Promo' : 'Nueva Promo'}</h2>
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
                            <label>Productos asociados:</label>
                            <div className="products-table associated-products" style={{ marginTop: 8 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ display: 'table-header-group' }}>
                                        <tr>
                                            <th style={{ padding: '0.6rem' }}>Imagen</th>
                                            <th style={{ padding: '0.6rem' }}>Nombre</th>
                                            <th style={{ padding: '0.6rem' }}>Precio</th>
                                            <th style={{ padding: '0.6rem', width: 120 }}>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editingProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '0.8rem', color: '#bbb' }}>No hay productos asociados</td>
                                            </tr>
                                        )}

                                        {editingProducts.map(prod => (
                                            <tr key={prod.ID} style={{ background: 'transparent' }}>
                                                <td style={{ padding: '0.6rem' }}>
                                                    {prod.Imagen
                                                        ? <img src={prod.Imagen} alt={prod.Nombre} className="product-thumb" />
                                                        : <div style={{ width: 60, height: 60, background: '#222', borderRadius: 8 }} />}
                                                </td>
                                                <td style={{ padding: '0.6rem' }}>
                                                    <div className="description-cell" title={prod.Descripcion || prod.Nombre}>
                                                        {prod.Nombre}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.6rem' }}>
                                                    {prod.Precio != null ? `$${prod.Precio}` : '-'}
                                                </td>
                                                <td style={{ padding: '0.6rem' }}>
                                                    <button type="button" className="btn-delete" onClick={() => handleRemoveProductFromEditing(prod.ID)}>Quitar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                                <select
                                    value={selectedProductToAdd}
                                    onChange={e => setSelectedProductToAdd(e.target.value)}
                                    className="form-select"
                                    style={{ flex: 1 }}
                                >
                                    <option value="">-- Seleccionar producto para agregar --</option>
                                    {availableProductsForAdd.map(p => (
                                        <option key={p.ID} value={p.ID}>{p.Nombre} {p.Precio != null ? `- $${p.Precio}` : ''}</option>
                                    ))}
                                </select>
                                <button type="button" className="btn-save" onClick={handleAddProductToEditing}>Agregar</button>
                            </div>
                        </div>

                        {imagePreview && (
                            <div className="image-preview-container">
                                <img src={imagePreview} alt="Vista previa" className="image-preview" />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Imagen {editingPromo && '(opcional)'}:</label>
                            <input type="file" name="Imagen" accept="image/*" onChange={handleChange} required={!editingPromo} />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-save">{editingPromo ? 'Modificar' : 'Añadir'}</button>
                            <button type="button" className="btn-cancel" onClick={resetForm}>Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
            )}

            <div className="products-table-container">
                <h2>Promos</h2>
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promos.map(promo => (
                            <tr key={promo.ID}>
                                <td>{promo.ID}</td>
                                <td>
                                    {promo.Imagen ? <img src={promo.Imagen} alt={promo.Nombre} className="product-thumb" /> : <div style={{ width: 60, height: 60, background: '#222', borderRadius: 8 }} />}
                                </td>
                                <td>{promo.Nombre}</td>
                                <td>${promo.Precio}</td>
                                <td>
                                    <button className="btn-edit" onClick={() => handleEdit(promo)}>Editar</button>
                                    <button className="btn-delete" onClick={() => handleDelete(promo.ID)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PromosSection