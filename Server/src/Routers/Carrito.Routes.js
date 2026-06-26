const Express = require("express");
const Rutas = Express.Router();

const {
    ObtenerCarrito,
    AñadirProdCarrito,
    EliminarProdCarrito,
    VaciarCarrito,
    AñadirPromCarrito,
    EliminarPromCarrito,
    RealizarPedido,
    CancelarPedido,
    ObtenerPedidos,
    ProcesarPedido,
    ActualizarCarrito
} = require("../Controller/Carrito.Controller");

Rutas.post("/obtenercarrito", ObtenerCarrito);
Rutas.post("/anadirprodcarrito", AñadirProdCarrito);
Rutas.post("/eliminarprodcarrito", EliminarProdCarrito);
Rutas.post("/vaciarcarrito", VaciarCarrito);
Rutas.post("/anadirpromcarrito", AñadirPromCarrito);
Rutas.post("/eliminarpromcarrito", EliminarPromCarrito);
Rutas.post("/realizarpedido", RealizarPedido);
Rutas.post("/cancelarpedido", CancelarPedido);
Rutas.get("/obtenerpedidos", ObtenerPedidos);
Rutas.post("/procesarpedido", ProcesarPedido);
Rutas.post("/actualizarcarrito", ActualizarCarrito);

module.exports = Rutas;