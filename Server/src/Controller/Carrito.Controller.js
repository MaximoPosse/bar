/**
 * Controlador del Carrito de Compras
 * 
 * Maneja las operaciones del carrito: agregar/eliminar productos y
 * promociones, modificar cantidades y vaciar el carrito completo.
 */

const { dbGet, dbAll, dbRun } = require("../Utils/Querys")

// ──────────────────────────────────────────────
//  FUNCIONES AUXILIARES
// ──────────────────────────────────────────────

async function clienteExiste(id) {
    let cliente = await dbGet("SELECT * FROM Cliente WHERE Id = ?", [id]);
    if (cliente) return true;
    cliente = await dbGet("SELECT * FROM Empleado WHERE ID = ?", [id]);
    return cliente != false;
}

async function productoExiste(id) {
    const producto = await dbGet("SELECT * FROM Productos WHERE ID = ?", [id]);
    return producto != false;
}

async function promoExiste(id) {
    const promo = await dbGet("SELECT * FROM Promos WHERE ID = ?", [id]);
    return promo != false;
}

// ──────────────────────────────────────────────
//  OBTENER CARRITO
// ──────────────────────────────────────────────

/**
 * POST /api/obtenercarrito
 * Obtiene el contenido del carrito de un cliente :D
 *
 * Body: { ID_Cliente }
 * 
 * Devuelve un array donde cada item puede ser un producto (ID_Promo == -1)
 * o una promoción (ID_Promo != -1):
 * [
 *   { ID_Carrito, ID_Producto, ProductoNombre, ProductoPrecio, Cantidad, ID_Promo, ... },
 *   { ID_Carrito, ID_Producto: -1, ProductoNombre: null, Cantidad, ID_Promo, PromoNombre, ... }
 * ]
 */
async function ObtenerCarrito(req, res)
{
    const { ID_Cliente } = req.body;
    if (!ID_Cliente)
        return res.status(400).json({ Error: "Falta ID del cliente" });

    const carrito = await dbAll(`
        SELECT
            Carrito.ID          AS ID_Carrito,
            Carrito.ID_Producto,
            Productos.Nombre    AS ProductoNombre,
            Productos.Precio    AS ProductoPrecio,
            Productos.Imagen    AS ProductoImagen,
            Productos.Descripcion AS ProductoDescripcion,
            Carrito.Cantidad,
            Carrito.ID_Promo,
            Promos.Nombre       AS PromoNombre,
            Promos.Precio       AS PromoPrecio,
            Promos.Imagen       AS PromoImagen,
            Promos.Descripcion  AS PromoDescripcion
        FROM Carrito
        LEFT JOIN Productos ON Carrito.ID_Producto = Productos.ID
        LEFT JOIN Promos ON Carrito.ID_Promo = Promos.ID
        WHERE Carrito.ID_Cliente = ?
    `, [ID_Cliente]);

    carrito.forEach(item => {
        if (item.ProductoImagen) item.ProductoImagen = item.ProductoImagen.toString("base64");
        if (item.PromoImagen) item.PromoImagen = item.PromoImagen.toString("base64");
    });

    return res.status(200).json(carrito);
}

// ──────────────────────────────────────────────
//  PRODUCTOS EN CARRITO
// ──────────────────────────────────────────────

/**
 * POST /api/anadirprodcarrito
 * Agrega un producto al carrito. Si ya existe, incrementa la cantidad.
 * Body: { ID_Cliente, ID_Producto }
 */
async function AñadirProdCarrito(req, res)
{
    const { ID_Cliente, ID_Producto } = req.body;
    if (!ID_Cliente || !ID_Producto)
        return res.status(400).json({ Error: "Faltan ID_Cliente o ID_Producto" });
    if (!await clienteExiste(ID_Cliente))
        return res.status(404).json({ Error: "Cliente inexistente", ID_Cliente });
    if (!await productoExiste(ID_Producto))
        return res.status(404).json({ Error: "Producto inexistente", ID_Producto });

    const item = await dbGet(`SELECT * FROM Carrito WHERE ID_Producto = ? AND ID_Cliente = ?`, [ID_Producto, ID_Cliente]);

    if (item) {
        await dbRun(`UPDATE Carrito SET Cantidad = ? WHERE ID = ?`, [item.Cantidad + 1, item.ID]);
    } else {
        await dbRun(`INSERT INTO Carrito(ID_Producto, ID_Promo, ID_Cliente, Cantidad) VALUES (?, -1, ?, 1)`, [ID_Producto, ID_Cliente]);
    }

    return res.status(201).json({ Mensaje: "Producto añadido al carrito" });
}

/**
 * POST /api/eliminarprodcarrito
 * Disminuye la cantidad de un producto o lo elimina del carrito.
 * Si cantidad > 1, solo decrementa. Si cantidad == 1 o Eliminar=true, lo elimina.
 * Body: { ID_Cliente, ID_Producto, Eliminar? }
 */
async function EliminarProdCarrito(req, res)
{
    const { ID_Cliente, ID_Producto, Eliminar } = req.body;
    if (!ID_Cliente || !ID_Producto)
        return res.status(400).json({ Error: "Faltan ID_Cliente o ID_Producto" });
    if (!await clienteExiste(ID_Cliente))
        return res.status(404).json({ Error: "Cliente inexistente" });
    if (!await productoExiste(ID_Producto))
        return res.status(404).json({ Error: "Producto inexistente" });

    const item = await dbGet(`SELECT * FROM Carrito WHERE ID_Producto = ? AND ID_Cliente = ?`, [ID_Producto, ID_Cliente]);
    if (!item)
        return res.status(404).json({ Error: "El cliente no tiene ese producto en el carrito" });

    if (item.Cantidad > 1 && !Eliminar) {
        await dbRun(`UPDATE Carrito SET Cantidad = ? WHERE ID = ?`, [item.Cantidad - 1, item.ID]);
        return res.status(200).json({ Mensaje: "Cantidad de producto disminuida" });
    } else {
        await dbRun(`DELETE FROM Carrito WHERE ID = ?`, [item.ID]);
        return res.status(200).json({ Mensaje: "Producto eliminado del carrito" });
    }
}

// ──────────────────────────────────────────────
//  PROMOCIONES EN CARRITO
// ──────────────────────────────────────────────

/**
 * POST /api/anadirpromcarrito
 * Agrega una promo al carrito. Si ya existe, incrementa la cantidad.
 * Body: { ID_Cliente, ID_Promo }
 */
async function AñadirPromCarrito(req, res)
{
    const { ID_Cliente, ID_Promo } = req.body;
    if (!ID_Cliente || !ID_Promo)
        return res.status(400).json({ Error: "Faltan ID_Cliente o ID_Promo" });
    if (!await clienteExiste(ID_Cliente))
        return res.status(404).json({ Error: "Cliente inexistente", ID_Cliente });
    if (!await promoExiste(ID_Promo))
        return res.status(404).json({ Error: "Promo inexistente", ID_Promo });

    const item = await dbGet(`SELECT * FROM Carrito WHERE ID_Promo = ? AND ID_Cliente = ?`, [ID_Promo, ID_Cliente]);

    if (item) {
        await dbRun(`UPDATE Carrito SET Cantidad = ? WHERE ID = ?`, [item.Cantidad + 1, item.ID]);
    } else {
        await dbRun(`INSERT INTO Carrito(ID_Producto, ID_Promo, ID_Cliente, Cantidad) VALUES (-1, ?, ?, 1)`, [ID_Promo, ID_Cliente]);
    }

    return res.status(201).json({ Mensaje: "Promo añadida al carrito" });
}

/**
 * POST /api/eliminarpromcarrito
 * Disminuye la cantidad de una promo o la elimina del carrito.
 * Si cantidad > 1, solo decrementa. Si cantidad == 1 o Eliminar=true, la elimina.
 * Body: { ID_Cliente, ID_Promo, Eliminar? }
 */
// No se para que repito pero ante la duda lo dejo :D
async function EliminarPromCarrito(req, res)
{
    const { ID_Cliente, ID_Promo, Eliminar } = req.body;
    if (!ID_Promo || !ID_Cliente)
        return res.status(400).json({ Error: "Faltan ID_Promo o ID_Cliente" });
    if (!await clienteExiste(ID_Cliente))
        return res.status(404).json({ Error: "Cliente inexistente" });
    if (!await promoExiste(ID_Promo))
        return res.status(404).json({ Error: "Promo inexistente" });

    const item = await dbGet(`SELECT * FROM Carrito WHERE ID_Promo = ? AND ID_Cliente = ?`, [ID_Promo, ID_Cliente]);
    if (!item)
        return res.status(404).json({ Error: "El cliente no tiene esa promo en el carrito" });

    if (item.Cantidad > 1 && !Eliminar) {
        await dbRun(`UPDATE Carrito SET Cantidad = ? WHERE ID = ?`, [item.Cantidad - 1, item.ID]);
        return res.status(200).json({ Mensaje: "Cantidad de promo disminuida" });
    } else {
        await dbRun(`DELETE FROM Carrito WHERE ID = ?`, [item.ID]);
        return res.status(200).json({ Mensaje: "Promo eliminada del carrito" });
    }
}

// ──────────────────────────────────────────────
//  VACIAR CARRITO
// ──────────────────────────────────────────────

/**
 * POST /api/vaciarcarrito
 * Elimina todos los items del carrito de un cliente.
 * Body: { ID_Cliente }
 */
async function VaciarCarrito(req, res)
{
    const { ID_Cliente } = req.body;
    if (!ID_Cliente)
        return res.status(400).json({ Error: "Falta ID_Cliente" });
    if (!await clienteExiste(ID_Cliente))
        return res.status(404).json({ Error: "Cliente inexistente" });

    await dbRun(`DELETE FROM Carrito WHERE ID_Cliente = ?`, [ID_Cliente]);
    return res.status(200).json({ Mensaje: "Carrito vaciado exitosamente" });
}

module.exports = {
    ObtenerCarrito,
    AñadirProdCarrito,
    EliminarProdCarrito,
    VaciarCarrito,
    AñadirPromCarrito,
    EliminarPromCarrito
}