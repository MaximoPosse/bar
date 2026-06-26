import { useRef, useState, useEffect, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import axios from 'axios'

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'

function toGrayscale(video) {
  const c = document.createElement('canvas')
  c.width = video.videoWidth || 640
  c.height = video.videoHeight || 480
  const ctx = c.getContext('2d')
  ctx.drawImage(video, 0, 0, c.width, c.height)
  const imageData = ctx.getImageData(0, 0, c.width, c.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    data[i] = data[i + 1] = data[i + 2] = gray
  }
  ctx.putImageData(imageData, 0, 0)
  return c
}

function FaceAuth({ mode, userName, onSuccess, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('Inicializando...')
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [stream, setStream] = useState(null)
  const [matchedUser, setMatchedUser] = useState(null)
  const canvasSizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    let cancelled = false
    async function loadModels() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        if (!cancelled) {
          setModelsLoaded(true)
          setStatus('Modelos cargados. Iniciando cámara...')
          startCamera()
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('Error cargando modelos: ' + err.message)
        }
      }
    }
    loadModels()
    return () => { cancelled = true; stopCamera() }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }, [stream])

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
      setStatus('Cámara activa. ' + (mode === 'register' ? 'Presiona "Capturar Rostro"' : 'Presiona "Iniciar con Rostro"'))
    } catch (err) {
      setStatus('Error al acceder a la cámara: ' + err.message)
    }
  }

  function setCanvasSize() {
    if (!canvasRef.current || !videoRef.current) return
    const w = videoRef.current.videoWidth || 640
    const h = videoRef.current.videoHeight || 480
    canvasRef.current.width = w
    canvasRef.current.height = h
    canvasRef.current.style.width = '100%'
    canvasRef.current.style.height = '100%'
    canvasSizeRef.current = { width: w, height: h }
  }

  async function captureFace() {
    if (!videoRef.current || !modelsLoaded) return
    setStatus('Detectando rostro...')
    try {
      setCanvasSize()
      const grayCanvas = toGrayscale(videoRef.current)
      const det = await faceapi.detectSingleFace(grayCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor()
      if (!det) {
        setStatus('No se detectó ningún rostro. Asegúrate de estar bien iluminado y mirando a la cámara.')
        return
      }
      const desc = Array.from(det.descriptor)

      if (canvasRef.current && canvasSizeRef.current.width > 0) {
        const display = canvasRef.current
        const dims = { width: canvasSizeRef.current.width, height: canvasSizeRef.current.height }
        const resized = faceapi.resizeResults(det, dims)
        const ctx = display.getContext('2d')
        ctx.clearRect(0, 0, display.width, display.height)
        const box = resized.detection.box
        ctx.strokeStyle = '#8B6B3D'
        ctx.lineWidth = 3
        ctx.strokeRect(box.x, box.y, box.width, box.height)
        ctx.fillStyle = 'rgba(139,107,61,0.15)'
        ctx.fillRect(box.x, box.y, box.width, box.height)
      }

      if (mode === 'register') {
        setStatus('Rostro capturado correctamente. Guardando...')
        await saveFace(desc)
      } else {
        setStatus('Rostro detectado. Verificando identidad...')
        await verifyFace(desc)
      }
    } catch (err) {
      setStatus('Error al procesar rostro: ' + err.message)
    }
  }

  async function saveFace(desc) {
    try {
      const users = JSON.parse(localStorage.getItem('faceUsers') || '[]')
      const existing = users.findIndex(u => u.Nombre === userName)
      const entry = { Nombre: userName, Rostro: desc }
      if (existing >= 0) {
        users[existing] = entry
      } else {
        users.push(entry)
      }
      localStorage.setItem('faceUsers', JSON.stringify(users))
      setStatus('✅ Registro de rostro facial exitoso')
      setTimeout(() => { if (onClose) onClose() }, 2000)
    } catch (err) {
      setStatus('Error guardando rostro: ' + err.message)
    }
  }

  function cosineSimilarity(a, b) {
    let dot = 0, na = 0, nb = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      na += a[i] * a[i]
      nb += b[i] * b[i]
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb))
  }

  async function verifyFace(desc) {
    try {
      const users = JSON.parse(localStorage.getItem('faceUsers') || '[]')
      let bestMatch = null
      let bestScore = 0

      for (const user of users) {
        const score = cosineSimilarity(desc, user.Rostro)
        if (score > bestScore) {
          bestScore = score
          bestMatch = user
        }
      }

      const threshold = 0.45
      if (bestMatch && bestScore > threshold) {
        setMatchedUser(bestMatch)
        setStatus(`Rostro verificado. ¡Bienvenido ${bestMatch.Nombre}! (similitud: ${(bestScore * 100).toFixed(1)}%)`)
        if (onSuccess) {
          try {
            const res = await axios.post('https://bar-caliz-backend.onrender.com/api/login', {
              Nombre: bestMatch.Nombre,
              Contraseña: 'face_auth_bypass'
            })
            if (res.data.Cliente) {
              onSuccess(res.data.Cliente, false)
            } else {
              onSuccess({ Id: null, Nombre: bestMatch.Nombre, Correo: '' }, false)
            }
          } catch {
            onSuccess({ Id: null, Nombre: bestMatch.Nombre, Correo: '' }, false)
          }
        }
      } else {
        setStatus(`Rostro no reconocido (mejor coincidencia: ${(bestScore * 100).toFixed(1)}%). Regístrate primero o intenta de nuevo.`)
      }
    } catch (err) {
      setStatus('Error verificando rostro: ' + err.message)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="face-capture-container">
      <div style={{ position: 'relative' }}>
        <video ref={videoRef} autoPlay muted playsInline
          onLoadedMetadata={() => setCanvasSize()}
          style={{ width: '100%', borderRadius: 8, transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
      </div>
      <p style={{ color: 'var(--caliz-cream)', textAlign: 'center', fontSize: 14, margin: '10px 0', opacity: 0.8 }}>
        {status}
      </p>
      {!matchedUser && (
        <div className="face-capture-actions">
          <button onClick={captureFace}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: 5, fontFamily: 'inherit', fontWeight: 700,
              cursor: 'pointer', background: 'var(--caliz-bronze)', color: 'var(--caliz-cream)',
              border: '2px solid var(--caliz-bronze)', textTransform: 'uppercase', letterSpacing: 1
            }}
          >
            {isLogin ? 'Iniciar con Rostro' : 'Capturar Rostro'}
          </button>
          <button onClick={onClose}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: 5, fontFamily: 'inherit', fontWeight: 700,
              cursor: 'pointer', background: 'transparent', color: 'var(--caliz-cream)',
              border: '2px solid var(--caliz-cream)', textTransform: 'uppercase', letterSpacing: 1
            }}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

export default FaceAuth
