// Login.jsx (reemplaza o adapta tu componente actual con esto)
import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../../Context/AuthContext'
import './Login.css'

function Login({ onClose }) {
  const [isRegister, setIsRegister] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [formData, setFormData] = useState({
    Nombre: '',
    Correo: '',
    Contraseña: '',
    ConfirmarContraseña: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login } = useAuth()

  // Estados para "olvidé mi contraseña" (cliente-side verification)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotNombre, setForgotNombre] = useState('') // pedimos nombre para poder "loguear" después
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStage, setForgotStage] = useState('email') // 'email' | 'code'
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [codeInput, setCodeInput] = useState('')

  // Aquí guardamos el código generado localmente (plain text)
  const [localResetCode, setLocalResetCode] = useState(null)
  const [codeExpiresAt, setCodeExpiresAt] = useState(null)
  const [attemptsLeft, setAttemptsLeft] = useState(5)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (isRegister) {
      // Validaciones para registro
      if (!formData.Nombre || !formData.Correo || !formData.Contraseña) {
        setError('Todos los campos son obligatorios')
        return
      }
      if (formData.Contraseña !== formData.ConfirmarContraseña) {
        setError('Las contraseñas no coinciden')
        return
      }
      if (formData.Contraseña.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return
      }

      // No permitir registro de admins
      if (isAdminLogin) {
        setError('El registro de administradores está deshabilitado')
        return
      }

      try {
        const response = await axios.post('http://localhost:3000/api/registrarse', {
          Nombre: formData.Nombre,
          Correo: formData.Correo,
          Contraseña: formData.Contraseña
        })

        setSuccess(response.data.Mensaje || 'Registro exitoso')
        setTimeout(() => {
          setIsRegister(false)
          setFormData({
            Nombre: '',
            Correo: '',
            Contraseña: '',
            ConfirmarContraseña: ''
          })
        }, 1500)
      } catch (err) {
        setError(err.response?.data?.Error || 'Error al registrar')
      }
    } else {
      // Login tradicional
      if (!formData.Nombre || !formData.Contraseña) {
        setError('Nombre y contraseña son obligatorios')
        return
      }

      try {
        const endpoint = isAdminLogin
          ? 'http://localhost:3000/api/loginadmin'
          : 'http://localhost:3000/api/login'
        
        const response = await axios.post(endpoint, {
          Nombre: formData.Nombre,
          Contraseña: formData.Contraseña
        })

        const userData = isAdminLogin ? response.data.Empleado : response.data.Cliente
        login(userData, isAdminLogin)
        setSuccess(response.data.Mensaje || 'Login exitoso')
        setTimeout(() => {
          if (onClose) onClose()
        }, 1000)
      } catch (err) {
        setError(err.response?.data?.Error || 'Error al iniciar sesión')
      }
    }
  }

  // ---------- Forgot password (client-side verification) ----------

  // Genera un código de 6 dígitos como string
  const generarCodigo6 = () => String(Math.floor(100000 + Math.random() * 900000))

  // Abre modal de forgot
  const openForgot = () => {
    setForgotOpen(true)
    setForgotStage('email')
    setForgotNombre('')
    setForgotEmail('')
    setForgotMsg('')
    setForgotError('')
    setCodeInput('')
    setLocalResetCode(null)
    setCodeExpiresAt(null)
    setAttemptsLeft(5)
  }

  // Paso 1: generar código en cliente y pedir al servidor que lo envíe usando tu endpoint existente /api/enviarcorreo
  const submitForgotEmail = async () => {
    setForgotError('')
    setForgotMsg('')

    if (!forgotNombre || !forgotEmail) { 
      setForgotError('Ingresa tu Nombre y tu Correo'); 
      return 
    }

    // generar código localmente
    const code = generarCodigo6()
    const ttlMinutes = 10
    const expires = Date.now() + ttlMinutes * 60 * 1000

    // construir cuerpo del mail
    const asunto = 'Código de recuperación - TuApp'
    const cuerpo = `Hola ${forgotNombre}.\n\nTu código de recuperación es: ${code}\n\nEste código expirará en ${ttlMinutes} minutos.\nSi no lo solicitaste, ignora este correo.`

    try {
      // Pedimos al servidor que envie el correo (solo usamos EnviarCorreo)
      await axios.post('http://localhost:3000/api/enviarcorreo', {
        Destinatario: forgotEmail,
        Asunto: asunto,
        Cuerpo: cuerpo
      })

      // guardamos el código en cliente para la verificación local
      setLocalResetCode(String(code))
      setCodeExpiresAt(expires)
      setAttemptsLeft(5)
      setForgotMsg('Código enviado. Revisa tu correo (incluido spam).')
      setForgotStage('code')
    } catch (err) {
      console.error(err)
      setForgotError('Error al enviar el correo. Intenta más tarde.')
    }
  }

  // Paso 2: verificar en el cliente (compara con el código guardado en estado)
  const submitForgotCode = async () => {
    setForgotError('')
    if (!codeInput || codeInput.trim().length !== 6) { setForgotError('Ingresa el código de 6 dígitos'); return }

    // comprobaciones locales
    if (!localResetCode) { setForgotError('No hay código generado. Solicita uno.'); return }
    if (Date.now() > codeExpiresAt) { setForgotError('Código expirado. Solicita uno nuevo.'); return }
    if (attemptsLeft <= 0) { setForgotError('No quedan intentos. Solicita un nuevo código.'); return }

    if (String(codeInput).trim() !== String(localResetCode).trim()) {
      setAttemptsLeft(prev => prev - 1)
      setForgotError(`Código incorrecto. Intentos restantes: ${attemptsLeft - 1}`)
      return
    }

    // Si llegamos aquí, el código es correcto: hacemos "login automático" en el cliente
    // NOTA: esto no valida contra la DB. Es una simulación de login para uso escolar/demo.
    const fakeUser = {
      Id: null,
      Nombre: forgotNombre,
      Correo: forgotEmail
    }
    login(fakeUser, false)
    setForgotMsg('Código correcto. Has iniciado sesión.')
    setTimeout(() => {
      setForgotOpen(false)
      if (onClose) onClose()
    }, 800)
  }

  return (
    <div className="login-overlay">
      <div className="login-container">
        <button className="login-close" onClick={onClose}>×</button>
        <h2>{isRegister ? 'Registro' : 'Iniciar Sesión'}</h2>
        
        <div className="login-tabs">
          <button 
            className={!isAdminLogin ? 'active' : ''}
            onClick={() => {
              setIsAdminLogin(false)
              setIsRegister(false)
            }}
          >
            Cliente
          </button>
          <button 
            className={isAdminLogin ? 'active' : ''}
            onClick={() => {
              setIsAdminLogin(true)
              setIsRegister(false)
            }}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="Nombre"
            placeholder="Nombre de usuario"
            value={formData.Nombre}
            onChange={handleChange}
            required
          />
          
          {isRegister && (
            <input
              type="email"
              name="Correo"
              placeholder="Correo electrónico"
              value={formData.Correo}
              onChange={handleChange}
              required
            />
          )}

          <input
            type="password"
            name="Contraseña"
            placeholder="Contraseña"
            value={formData.Contraseña}
            onChange={handleChange}
            required
          />

          {isRegister && (
            <input
              type="password"
              name="ConfirmarContraseña"
              placeholder="Confirmar contraseña"
              value={formData.ConfirmarContraseña}
              onChange={handleChange}
              required
            />
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="submit-btn">
            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        {!isAdminLogin && (
          <div className="login-switch" style={{ marginTop: 12 }}>
            <span>
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            </span>
            <button onClick={() => {
              setIsRegister(!isRegister)
              setError('')
              setSuccess('')
            }}>
              {isRegister ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </div>
        )}

        {/* Link "Olvidaste tu contraseña?" solo para clientes */}
        {!isAdminLogin && (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <button
              onClick={openForgot}
              style={{ background: 'none', border: 'none', color: '#4CAF50', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {isAdminLogin && (
          <div className="login-info">
            <p>El registro de administradores está deshabilitado.</p>
            <p>Contacta al SUPERADMIN para crear nuevas cuentas.</p>
          </div>
        )}
      </div>

      {/* Modal de Olvidé mi contraseña (cliente-side) */}
      {forgotOpen && (
        <div className="login-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="login-container" style={{ maxWidth: 520 }}>
            <button className="login-close" onClick={() => setForgotOpen(false)}>×</button>
            <h2>Recuperar contraseña (demo)</h2>

            {forgotStage === 'email' && (
              <>
                <p>Ingresa tu Nombre y el correo asociado. Te mandamos un código de 6 dígitos.</p>
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={forgotNombre}
                  onChange={(e) => setForgotNombre(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                {forgotError && <div className="error-message">{forgotError}</div>}
                {forgotMsg && <div className="success-message">{forgotMsg}</div>}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="submit-btn" onClick={submitForgotEmail}>Enviar código</button>
                  <button className="btn-cancel" onClick={() => setForgotOpen(false)}>Cancelar</button>
                </div>
              </>
            )}

            {forgotStage === 'code' && (
              <>
                <p>Ingresa el código de 6 dígitos que recibiste por correo.</p>
                <input
                  type="text"
                  placeholder="Código (6 dígitos)"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                  {attemptsLeft} intentos restantes. Código expira {codeExpiresAt ? new Date(codeExpiresAt).toLocaleTimeString() : ''}
                </div>
                {forgotError && <div className="error-message">{forgotError}</div>}
                {forgotMsg && <div className="success-message">{forgotMsg}</div>}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="submit-btn" onClick={submitForgotCode}>Verificar código</button>
                  <button className="btn-cancel" onClick={() => { setForgotStage('email'); setCodeInput(''); setForgotMsg('') }}>Volver</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
