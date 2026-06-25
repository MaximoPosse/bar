/**
 * Rutas del Carrito de Compras
 * 
 * Endpoints para gestionar el carrito de compras de los clientes,
 * permitiendo agregar/eliminar productos y promociones.
 */

const Express = require("express");
const Rutas = Express.Router();

const {
    ObtenerCarrito,
    AñadirProdCarrito,
    EliminarProdCarrito,
    VaciarCarrito,
    AñadirPromCarrito,
    EliminarPromCarrito
} = require("../Controller/Carrito.Controller");

Rutas.post("/obtenercarrito", ObtenerCarrito);              // Obtener contenido del carrito
Rutas.post("/anadirprodcarrito", AñadirProdCarrito);        // Agregar producto al carrito
Rutas.post("/eliminarprodcarrito", EliminarProdCarrito);    // Eliminar/quitar cantidad de producto
Rutas.post("/anadirpromcarrito", AñadirPromCarrito);        // Agregar promo al carrito
Rutas.post("/eliminarpromcarrito", EliminarPromCarrito);    // Eliminar/quitar cantidad de promo
Rutas.post("/vaciarcarrito", VaciarCarrito);                // Vaciar carrito completo

module.exports = Rutas;