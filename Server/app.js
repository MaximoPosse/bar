const express= require('express')

const App= express()

const cors= require('cors')

App.use(cors())
App.use(express.json())

const CarritoRoutes = require("./src/Routers/Carrito.Routes");
const LoginRoutes = require('./src/Routers/Login.Routes')
const ProductosRoutes = require("./src/Routers/Productos.Routes")
App.use('/api', LoginRoutes, CarritoRoutes, ProductosRoutes)

require('dotenv').config()
const PORT = process.env.PORT || 3000

App.listen(PORT,()=>
{
    console.log(`🚀 http://localhost:${PORT}`)
})