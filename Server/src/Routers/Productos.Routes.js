/**
 * Rutas de Productos y Promociones
 * 
 * Endpoints CRUD para productos y promociones del menú,
 * incluyendo subida de imágenes con multer.
 */

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
    EliminarPromo,
    ObtenerCategorias
} = require("../Controller/Productos.Controller");

// --- Productos ---
Rutas.get("/obtenerproductos", ObtenerProductos);                    // Listar productos (filtro por categoría)
Rutas.get("/obtenercategorias", ObtenerCategorias);                 // Listar categorías disponibles
Rutas.post("/anadirproducto", upload.single("Imagen"), AñadirProducto);     // Agregar producto
Rutas.post("/modificarproducto", upload.single("Imagen"), ModificarProducto); // Modificar producto
Rutas.post("/eliminarproducto", EliminarProducto);                  // Eliminar producto

// --- Promociones ---
Rutas.get("/obtenerpromos", ObtenerPromos);                          // Listar promociones
Rutas.post("/anadirpromo", upload.single("Imagen"), AñadirPromo);   // Agregar promo
Rutas.post("/modificarpromo", upload.single("Imagen"), ModificarPromo);     // Modificar promo
Rutas.post("/eliminarpromo", EliminarPromo);                        // Eliminar promo

module.exports = Rutas;