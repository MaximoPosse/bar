import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../../Context/AuthContext'
import FaceAuth from '../FaceAuth'
import './Login.css'

function Login({ onClose }) {
  const [isRegister, setIsRegister] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [showFaceAuth, setShowFaceAuth] = useState(false)
  const [faceMode, setFaceMode] = useState('login')
  const [formData, setFormData] = useState({
    Nombre: '',
    Correo: '',
    Contraseña: '',
    ConfirmarContraseña: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login } = useAuth()

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotNombre, setForgotNombre] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStage, setForgotStage] = useState('email') // email | code | reset
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [localResetCode, setLocalResetCode] = useState(null)
  const [codeExpiresAt, setCodeExpiresAt] = useState(null)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCodeOnScreen, setShowCodeOnScreen] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (isRegister) {
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
      if (isAdminLogin) {
        setError('El registro de administradores está deshabilitado')
        return
      }
      try {
        await axios.post('https://bar-caliz-backend.onrender.com/api/registrarse', {
          Nombre: formData.Nombre, Correo: formData.Correo, Contraseña: formData.Contraseña
        })
        // Actualizar nombre en rostro guardado localmente con 'Usuario' genérico
        const faceUsers = JSON.parse(localStorage.getItem('faceUsers') || '[]')
        const idx = faceUsers.findIndex(u => u.Nombre === 'Usuario' || u.Nombre === '')
        if (idx >= 0) {
          faceUsers[idx].Nombre = formData.Nombre
          localStorage.setItem('faceUsers', JSON.stringify(faceUsers))
        }
        setSuccess('Registro exitoso')
        setTimeout(() => {
          setIsRegister(false)
          setFormData({ Nombre: '', Correo: '', Contraseña: '', ConfirmarContraseña: '' })
        }, 1500)
      } catch (err) {
        setError(err.response?.data?.Error || 'Error al registrar')
      }
    } else {
      if (!formData.Nombre || !formData.Contraseña) {
        setError('Nombre y contraseña son obligatorios')
        return
      }
      try {
        const endpoint = isAdminLogin
          ? 'https://bar-caliz-backend.onrender.com/loginadmin'
          : 'https://bar-caliz-backend.onrender.com/api/login'
        const response = await axios.post(endpoint, {
          Nombre: formData.Nombre, Contraseña: formData.Contraseña
        })
        const userData = isAdminLogin ? response.data.Empleado : response.data.Cliente
        login(userData, isAdminLogin)
        setSuccess('Login exitoso')
        setTimeout(() => { if (onClose) onClose() }, 1000)
      } catch (err) {
        setError(err.response?.data?.Error || 'Error al iniciar sesión')
      }
    }
  }

  const generarCodigo6 = () => String(Math.floor(100000 + Math.random() * 900000))

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
    setNewPassword('')
    setConfirmPassword('')
    setShowCodeOnScreen(false)
  }

  const submitForgotEmail = async () => {
    setForgotError('')
    setForgotMsg('')
    setShowCodeOnScreen(false)
    if (!forgotNombre) { setForgotError('Ingresa tu nombre de usuario'); return }
    try {
      const res = await axios.get(`https://bar-caliz-backend.onrender.com/api/obteneremailcliente/${encodeURIComponent(forgotNombre)}`)
      setForgotEmail(res.data.Correo)
      const code = generarCodigo6()
      const expires = Date.now() + 10 * 60 * 1000
      const asunto = 'Código de recuperación - Cáliz Taberna'
      const cuerpo = `Hola ${forgotNombre}.\n\nTu código de recuperación es: ${code}\n\nEste código expirará en 10 minutos.`
      try {
        await axios.post('https://bar-caliz-backend.onrender.com/api/enviarcorreo', {
          Destinatario: res.data.Correo, Asunto: asunto, Cuerpo: cuerpo
        })
        setForgotMsg('Código enviado a tu correo registrado.')
      } catch {
        setShowCodeOnScreen(true)
        setForgotMsg('No se pudo enviar el correo. Usa el código que aparece abajo.')
      }
      setLocalResetCode(String(code))
      setCodeExpiresAt(expires)
      setAttemptsLeft(5)
      setForgotStage('code')
    } catch (err) {
      setForgotError(err.response?.data?.Error || 'Usuario no encontrado')
    }
  }

  const submitForgotCode = () => {
    setForgotError('')
    if (!codeInput || codeInput.trim().length !== 6) { setForgotError('Ingresa el código de 6 dígitos'); return }
    if (!localResetCode) { setForgotError('No hay código generado.'); return }
    if (Date.now() > codeExpiresAt) { setForgotError('Código expirado.'); return }
    if (attemptsLeft <= 0) { setForgotError('Sin intentos.'); return }
    if (String(codeInput).trim() !== String(localResetCode).trim()) {
      setAttemptsLeft(prev => prev - 1)
      setForgotError(`Código incorrecto. Intentos: ${attemptsLeft - 1}`)
      return
    }
    setForgotStage('reset')
    setForgotMsg('')
    setCodeInput('')
  }

  const submitChangePassword = async () => {
    setForgotError('')
    if (!newPassword || newPassword.length < 6) { setForgotError('La contraseña debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setForgotError('Las contraseñas no coinciden'); return }
    try {
      await axios.post('https://bar-caliz-backend.onrender.com/api/cambiarcontraseña', {
        Nombre: forgotNombre, NuevaContraseña: newPassword
      })
      setForgotMsg('Contraseña cambiada correctamente. Iniciando sesión...')
      setTimeout(async () => {
        try {
          const res = await axios.post('https://bar-caliz-backend.onrender.com/api/login', {
            Nombre: forgotNombre, Contraseña: newPassword
          })
          login(res.data.Cliente, false)
        } catch {}
        setForgotOpen(false)
        if (onClose) onClose()
      }, 1000)
    } catch (err) {
      setForgotError(err.response?.data?.Error || 'Error al cambiar contraseña')
    }
  }

  const continueWithoutChange = async () => {
    login({ Id: null, Nombre: forgotNombre, Correo: forgotEmail }, false)
    setForgotOpen(false)
    if (onClose) onClose()
  }

  const handleFaceSuccess = (userData, isAdmin) => {
    login(userData, isAdmin)
    setTimeout(() => { if (onClose) onClose() }, 500)
  }

  return (
    <>
    <div className="login-overlay">
      <div className="login-container">
        <button className="login-close" onClick={onClose}>&times;</button>
        <h2>{showFaceAuth ? 'Autenticación Facial' : (isRegister ? 'Registro' : 'Iniciar Sesión')}</h2>

        {!showFaceAuth && (
          <>
            <div className="login-tabs">
              <button className={!isAdminLogin ? 'active' : ''} onClick={() => { setIsAdminLogin(false); setIsRegister(false); setFormData({ Nombre: '', Correo: '', Contraseña: '', ConfirmarContraseña: '' }) }}>
                Cliente
              </button>
              <button className={isAdminLogin ? 'active' : ''} onClick={() => { setIsAdminLogin(true); setIsRegister(false); setFormData({ Nombre: '', Correo: '', Contraseña: '', ConfirmarContraseña: '' }) }}>
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <input type="text" name="Nombre" placeholder="Nombre de usuario"
                value={formData.Nombre} onChange={handleChange} required autoComplete="off" />
              {isRegister && (
                <input type="email" name="Correo" placeholder="Correo electrónico"
                  value={formData.Correo} onChange={handleChange} required autoComplete="off" />
              )}
              <input type="password" name="Contraseña" placeholder="Contraseña"
                value={formData.Contraseña} onChange={handleChange} required autoComplete="new-password" />
              {isRegister && (
                <input type="password" name="ConfirmarContraseña" placeholder="Confirmar contraseña"
                  value={formData.ConfirmarContraseña} onChange={handleChange} required autoComplete="new-password" />
              )}
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="submit-btn">
                {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
              </button>
            </form>

            {!isAdminLogin && (
              <div className="login-switch">
                <span>{isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}</span>
                <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); setFormData({ Nombre: '', Correo: '', Contraseña: '', ConfirmarContraseña: '' }) }}>
                  {isRegister ? 'Iniciar Sesión' : 'Registrarse'}
                </button>
              </div>
            )}

            {!isAdminLogin && (
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <button onClick={openForgot}
                  style={{ background: 'none', border: 'none', color: 'var(--caliz-bronze)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {!isAdminLogin && !isRegister && (
              <div className="face-auth-section">
                <p>O inicia sesión con reconocimiento facial</p>
                <button className="face-login-btn" onClick={() => { setFaceMode('login'); setShowFaceAuth(true) }}>
                  Login Facial
                </button>
              </div>
            )}

            {isRegister && (
              <div className="face-auth-section">
                <p>Registra tu rostro para inicio de sesión rápido</p>
                <button className="face-login-btn" onClick={() => {
                  if (!formData.Nombre.trim()) {
                    setError('Primero ingresa tu nombre de usuario')
                    return
                  }
                  setFaceMode('register'); setShowFaceAuth(true)
                }}>
                  Registrar Rostro
                </button>
              </div>
            )}

            {isAdminLogin && (
              <div className="login-info">
                <p>Ingresa con las credenciales de administrador.</p>
                <p>Los admins son creados por el SUPERADMIN desde el panel.</p>
              </div>
            )}
          </>
        )}

        {showFaceAuth && (
          <FaceAuth
            mode={faceMode}
            userName={formData.Nombre || 'Usuario'}
            onSuccess={handleFaceSuccess}
            onClose={() => setShowFaceAuth(false)}
          />
        )}
      </div>
    </div>

    {forgotOpen && (
      <div className="login-overlay" style={{ background: 'rgba(42,18,21,0.6)', zIndex: 1001 }}>
        <div className="login-container" style={{ maxWidth: 520 }}>
          <button className="login-close" onClick={() => setForgotOpen(false)}>&times;</button>
          <h2>Recuperar contraseña</h2>

          {forgotStage === 'email' && (
            <>
              <p style={{ color: 'var(--caliz-cream)', marginBottom: 15, opacity: 0.8 }}>
                Ingresa tu nombre de usuario para recibir un código en tu correo registrado.
              </p>
              <input type="text" placeholder="Nombre de usuario"
                value={forgotNombre} onChange={(e) => setForgotNombre(e.target.value)}
                style={{ width: '100%', marginBottom: 10, padding: 10, background: 'var(--caliz-dark)',
                  border: '2px solid var(--caliz-bronze)', color: 'var(--caliz-cream)', borderRadius: 5, fontFamily: 'inherit' }} />
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
              <p style={{ color: 'var(--caliz-cream)', marginBottom: 15, opacity: 0.8 }}>
                Ingresa el código de 6 dígitos que enviamos a <strong>{forgotEmail}</strong>.
              </p>
              {showCodeOnScreen && (
                <div style={{ textAlign: 'center', marginBottom: 15, background: 'var(--caliz-dark)', padding: 15, borderRadius: 8, border: '2px solid var(--caliz-bronze)' }}>
                  <p style={{ color: 'var(--caliz-cream)', opacity: 0.7, fontSize: 13, marginBottom: 5 }}>Código (fallback):</p>
                  <p style={{ color: 'var(--caliz-bronze)', fontSize: 28, fontWeight: 'bold', letterSpacing: 8 }}>{localResetCode}</p>
                </div>
              )}
              <input type="text" placeholder="Código (6 dígitos)" value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                style={{ width: '100%', marginBottom: 10, padding: 10, background: 'var(--caliz-dark)',
                  border: '2px solid var(--caliz-bronze)', color: 'var(--caliz-cream)', borderRadius: 5, fontFamily: 'inherit' }} />
              <div style={{ fontSize: 12, color: 'var(--caliz-cream)', opacity: 0.6, marginTop: 6 }}>
                {attemptsLeft} intentos restantes.
              </div>
              {forgotError && <div className="error-message">{forgotError}</div>}
              {forgotMsg && <div className="success-message">{forgotMsg}</div>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="submit-btn" onClick={submitForgotCode}>Verificar código</button>
                <button className="btn-cancel" onClick={() => { setForgotStage('email'); setCodeInput(''); setForgotMsg(''); setShowCodeOnScreen(false) }}>Volver</button>
              </div>
            </>
          )}

          {forgotStage === 'reset' && (
            <>
              <p style={{ color: 'var(--caliz-cream)', marginBottom: 15, opacity: 0.8 }}>
                Código verificado. ¿Qué deseas hacer?
              </p>
              {forgotError && <div className="error-message">{forgotError}</div>}
              {forgotMsg && <div className="success-message">{forgotMsg}</div>}

              <div style={{ borderBottom: '1px solid var(--caliz-bronze)', paddingBottom: 15, marginBottom: 15 }}>
                <p style={{ color: 'var(--caliz-cream)', fontWeight: 'bold', marginBottom: 10 }}>Cambiar contraseña</p>
                <input type="password" placeholder="Nueva contraseña (mín. 6 caracteres)"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', marginBottom: 10, padding: 10, background: 'var(--caliz-dark)',
                    border: '2px solid var(--caliz-bronze)', color: 'var(--caliz-cream)', borderRadius: 5, fontFamily: 'inherit' }} />
                <input type="password" placeholder="Confirmar nueva contraseña"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', marginBottom: 10, padding: 10, background: 'var(--caliz-dark)',
                    border: '2px solid var(--caliz-bronze)', color: 'var(--caliz-cream)', borderRadius: 5, fontFamily: 'inherit' }} />
                <button className="submit-btn" onClick={submitChangePassword} style={{ width: '100%' }}>
                  Cambiar contraseña
                </button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--caliz-cream)', opacity: 0.7, marginBottom: 10, fontSize: 14 }}>
                  ¿No quieres cambiar tu contraseña?
                </p>
                <button className="btn-cancel" onClick={continueWithoutChange} style={{ width: '100%' }}>
                  Continuar sin problemas
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </>
  )
}

export default Login
