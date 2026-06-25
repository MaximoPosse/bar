/**
 * BarConnect - Servidor Backend
 * 
 * Punto de entrada del servidor Express.
 * Configura middlewares, rutas y levanta el servidor.
 */

require('dotenv').config()

const express = require('express')
const cors = require('cors')

const App = express()

// Middlewares globales
App.use(cors())          // Permitir peticiones desde cualquier origen
App.use(express.json())  // Parsear JSON en el body de las requests

// Rutas de la API (prefijo /api)
const LoginRoutes = require('./src/Routers/Login.Routes')
const ProductosRoutes = require("./src/Routers/Productos.Routes")
const CarritoRoutes = require("./src/Routers/Carrito.Routes")
App.use('/api', LoginRoutes)
App.use('/api', ProductosRoutes)
App.use('/api', CarritoRoutes)

const PORT = process.env.PORT || 3000

App.listen(PORT, () =>
{
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})