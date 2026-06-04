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

Rutas.post("/obtenercarrito", ObtenerCarrito);
Rutas.post("/anadirprodcarrito", AñadirProdCarrito);
Rutas.post("/eliminarprodcarrito", EliminarProdCarrito);
Rutas.post("/vaciarcarrito", VaciarCarrito);
Rutas.post("/anadirpromcarrito", AñadirPromCarrito);
Rutas.post("/eliminarpromcarrito", EliminarPromCarrito);

module.exports = Rutas;