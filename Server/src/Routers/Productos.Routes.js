const Express = require("express");
const Rutas = Express.Router();
const multer = require("multer");
const upload = multer()

const {
    ObtenerProductos,
    ObtenerPromos,
    AñadirProducto,
    ModificarProducto,
    EliminarProducto,
    AñadirPromo,
    ModificarPromo,
    EliminarPromo
} = require("../Controller/Productos.Controller");

Rutas.get("/obtenerproductos", ObtenerProductos);
Rutas.get("/obtenerpromos", ObtenerPromos);
Rutas.post("/anadirproducto", upload.single("Imagen"), AñadirProducto);
Rutas.post("/modificarproducto", upload.single("Imagen"), ModificarProducto);
Rutas.post("/eliminarproducto", EliminarProducto);
Rutas.post("/anadirpromo", upload.single("Imagen"), AñadirPromo);
Rutas.post("/modificarpromo", upload.single("Imagen"), ModificarPromo);
Rutas.post("/eliminarpromo", EliminarPromo);

module.exports = Rutas;