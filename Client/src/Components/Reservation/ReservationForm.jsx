import { useState } from 'react'
import { useAuth } from '../../Context/AuthContext'
import './ReservationForm.css'

function ReservationForm({ onClose }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    nombre: user?.Nombre || '',
    email: user?.Correo || '',
    telefono: '',
    fecha: '',
    hora: '',
    numeroPersonas: '',
    numeroMesa: '',
    comentarios: ''
  })
  const [message, setMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mesasDisponibles = Array.from({ length: 20 }, (_, i) => i + 1)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    // Simular envío de reserva (aquí puedes conectar con tu API)
    setTimeout(() => {
      setMessage({
        type: 'success',
        text: '¡Reserva realizada con éxito! Te contactaremos pronto para confirmar.'
      })
      setIsSubmitting(false)
      
      // Limpiar formulario después de 3 segundos
      setTimeout(() => {
        setFormData({
          nombre: user?.Nombre || '',
          email: user?.Correo || '',
          telefono: '',
          fecha: '',
          hora: '',
          numeroPersonas: '',
          numeroMesa: '',
          comentarios: ''
        })
        if (onClose) onClose()
      }, 3000)
    }, 1500)
  }

  return (
    <div className="reservation-overlay" onClick={onClose}>
      <div className="reservation-container" onClick={(e) => e.stopPropagation()}>
        <button className="reservation-close" onClick={onClose}>×</button>
        <h2>Reservar Mesa</h2>
        
        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={!!user?.Nombre}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!user?.Correo}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="numeroPersonas">Número de Personas</label>
              <input
                type="number"
                id="numeroPersonas"
                name="numeroPersonas"
                value={formData.numeroPersonas}
                onChange={handleChange}
                min="1"
                max="12"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha">Fecha</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="hora">Hora</label>
              <input
                type="time"
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="numeroMesa">Número de Mesa (Opcional)</label>
            <select
              id="numeroMesa"
              name="numeroMesa"
              value={formData.numeroMesa}
              onChange={handleChange}
            >
              <option value="">Seleccionar mesa...</option>
              {mesasDisponibles.map(num => (
                <option key={num} value={num}>Mesa {num}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="comentarios">Comentarios Adicionales (Opcional)</label>
            <textarea
              id="comentarios"
              name="comentarios"
              value={formData.comentarios}
              onChange={handleChange}
              rows="4"
              placeholder="Especificaciones especiales, ocasión, etc."
            />
          </div>

          {message && (
            <div className={`reservation-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationForm

