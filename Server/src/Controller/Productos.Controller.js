/**
 * Controlador de Productos y Promociones
 * 
 * Maneja el CRUD de productos y promociones del menú,
 * incluyendo la gestión de imágenes y la agrupación de
 * productos dentro de promociones.
 */

const { dbGet, dbAll, dbRun } = require("../Utils/Querys")

// ──────────────────────────────────────────────
//  FUNCIONES AUXILIARES
// ──────────────────────────────────────────────

async function productoExiste(id) {
    const producto = await dbGet("SELECT * FROM Productos WHERE ID = ?", [id]);
    return producto != false;
}

async function promoExiste(id) {
    const promo = await dbGet("SELECT * FROM Promos WHERE ID = ?", [id]);
    return promo != false;
}

// ──────────────────────────────────────────────
//  PRODUCTOS
// ──────────────────────────────────────────────

/**
 * GET /api/obtenerproductos
 * Obtiene todos los productos, opcionalmente filtrados por categoría.
 * Query params: ?categoria= Bebidas
 */
async function ObtenerProductos(req, res)
{
    const { categoria } = req.query;
    let query = "SELECT * FROM Productos";
    let params = [];

    if (categoria && categoria !== 'Todo el Menú' && categoria !== 'Todas') {
        query += " WHERE Categoria = ?";
        params.push(categoria);
    }

    const productos = await dbAll(query, params);
    if (!productos)
        return res.status(500).json({ Error: "Error en servidor" });

    productos.forEach(p => {
        if (p.Imagen) p.Imagen = p.Imagen.toString("base64");
    });

    return res.status(200).json(productos);
}

/**
 * GET /api/obtenercategorias
 * Obtiene lista de categorías disponibles de productos.
 */
async function ObtenerCategorias(req, res) {
    const cats = await dbAll("SELECT DISTINCT Categoria FROM Productos WHERE Categoria IS NOT NULL ORDER BY Categoria");
    return res.status(200).json(cats.map(c => c.Categoria));
}

/**
 * POST /api/anadirproducto
 * Agrega un nuevo producto al menú.
 * Body (multipart): Nombre, Precio, Imagen, Stock, Descripcion, Categoria
 */
async function AñadirProducto(req, res)
{
    const { Nombre, Precio, Stock, Descripcion, Categoria } = req.body;
    const idPromo = req.body.ID_Promo || -1;
    const imagen = req.file ? req.file.buffer : null;

    if (!Nombre || !Precio || !imagen || !Stock || !Descripcion)
        return res.status(400).json({ Error: "Faltan datos" });

    const categoria = Categoria || 'Bebidas';
    const error = await dbRun(
        `INSERT INTO Productos (Nombre, Precio, Imagen, Stock, Descripcion, ID_Promo, Categoria) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [Nombre, Precio, imagen, Stock, Descripcion, idPromo, categoria]
    );

    if (error)
        return res.status(500).json({ Error: "Error en servidor" });

    return res.status(201).json({ Mensaje: "Producto añadido", Nombre, Precio, Stock });
}

/**
 * POST /api/modificarproducto
 * Modifica un producto existente (con o sin imagen nueva).
 * Body (multipart): ID, Nombre, Precio, Stock, Descripcion, ID_Promo, Categoria, Imagen (opcional)
 */
async function ModificarProducto(req, res)
{
    const { ID, Nombre, Precio, Stock, Descripcion, ID_Promo, Categoria } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    if (!ID || !Nombre || !Precio || !Stock || !Descripcion)
        return res.status(400).json({ Error: "Faltan datos" });
    if (!await productoExiste(ID))
        return res.status(404).json({ Error: "Producto inexistente" });

    const categoria = Categoria || 'Bebidas';
    let query, params;

    if (imagen) {
        query = `UPDATE Productos SET Nombre = ?, Precio = ?, Imagen = ?, Stock = ?, Descripcion = ?, ID_Promo = ?, Categoria = ? WHERE ID = ?`;
        params = [Nombre, Precio, imagen, Stock, Descripcion, ID_Promo || -1, categoria, ID];
    } else {
        query = `UPDATE Productos SET Nombre = ?, Precio = ?, Stock = ?, Descripcion = ?, ID_Promo = ?, Categoria = ? WHERE ID = ?`;
        params = [Nombre, Precio, Stock, Descripcion, ID_Promo || -1, categoria, ID];
    }

    const error = await dbRun(query, params);
    if (error)
        return res.status(500).json({ Error: "Error en servidor" });

    return res.status(200).json({ Mensaje: "Producto modificado", Nombre, Precio, Stock });
}

/**
 * POST /api/eliminarproducto
 * Elimina un producto del menú y sus referencias en carritos.
 * Body: { ID }
 */
async function EliminarProducto(req, res)
{
    const { ID } = req.body;
    if (!ID)
        return res.status(400).json({ Error: "Falta ID" });

    if (!await productoExiste(ID))
        return res.status(404).json({ Error: "Producto inexistente" });

    await dbRun(`DELETE FROM Carrito WHERE ID_Producto = ?`, [ID]);
    await dbRun(`DELETE FROM Productos WHERE ID = ?`, [ID]);

    return res.status(200).json({ Mensaje: "Producto eliminado", ProductoID: ID });
}

// ──────────────────────────────────────────────
//  PROMOCIONES
// ──────────────────────────────────────────────

/**
 * GET /api/obtenerpromos
 * Obtiene todas las promociones con sus productos incluidos.
 * Las promos se devuelven agrupadas, cada una con su array de productos.
 */
async function ObtenerPromos(req, res) {
    const filas = await dbAll(`
        SELECT
            Productos.ID         AS ProductoID,
            Productos.Nombre     AS ProductoNombre,
            Productos.Precio     AS ProductoPrecio,
            Productos.Imagen     AS ProductoImagen,
            Productos.Stock,
            Productos.Descripcion AS ProductoDescripcion,
            Promos.ID            AS PromoID,
            Promos.Nombre        AS PromoNombre,
            Promos.Precio        AS PromoPrecio,
            Promos.Imagen        AS PromoImagen,
            Promos.Descripcion   AS PromoDescripcion
        FROM Productos
        JOIN Promos ON Productos.ID_Promo = Promos.ID
        WHERE Productos.ID_Promo != -1
        ORDER BY Promos.ID
    `);

    if (!filas) return res.status(500).json({ Error: "Error en servidor" });

    const promosMap = {};
    filas.forEach(fila => {
        if (!promosMap[fila.PromoID]) {
            promosMap[fila.PromoID] = {
                ID: fila.PromoID,
                Nombre: fila.PromoNombre,
                Precio: fila.PromoPrecio,
                Imagen: fila.PromoImagen ? fila.PromoImagen.toString("base64") : null,
                Descripcion: fila.PromoDescripcion,
                Productos: []
            };
        }
        promosMap[fila.PromoID].Productos.push({
            ID: fila.ProductoID,
            Nombre: fila.ProductoNombre,
            Precio: fila.ProductoPrecio,
            Imagen: fila.ProductoImagen ? fila.ProductoImagen.toString("base64") : null,
            Stock: fila.Stock,
            Descripcion: fila.ProductoDescripcion
        });
    });

    return res.status(200).json(Object.values(promosMap));
}

/**
 * POST /api/anadirpromo
 * Agrega una nueva promoción.
 * Body (multipart): Nombre, Precio, Imagen
 */
async function AñadirPromo(req, res) {
    const { Nombre, Precio } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    if (!Nombre || !Precio || !imagen)
        return res.status(400).json({ Error: "Faltan datos" });

    const error = await dbRun(`INSERT INTO Promos (Nombre, Precio, Imagen) VALUES (?, ?, ?)`, [Nombre, Precio, imagen]);
    if (error)
        return res.status(500).json({ Error: "Error en servidor" });

    return res.status(201).json({ Mensaje: "Promo añadida", Nombre, Precio });
}

/**
 * POST /api/modificarpromo
 * Modifica una promoción existente.
 * Body (multipart): ID, Nombre, Precio, Imagen
 */
async function ModificarPromo(req, res)
{
    const { ID, Nombre, Precio } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    if (!ID || !Nombre || !Precio || !imagen)
        return res.status(400).json({ Error: "Faltan datos" });
    if (!await promoExiste(ID))
        return res.status(404).json({ Error: "Promo inexistente" });

    const error = await dbRun(`UPDATE Promos SET Nombre = ?, Precio = ?, Imagen = ? WHERE ID = ?`, [Nombre, Precio, imagen, ID]);
    if (error)
        return res.status(500).json({ Error: "Error en servidor" });

    return res.status(200).json({ Mensaje: "Promo modificada", PromoID: ID, Nombre, Precio });
}

/**
 * POST /api/eliminarpromo
 * Elimina una promoción y sus referencias en carritos.
 * Body: { ID }
 */
async function EliminarPromo(req, res)
{
    const { ID } = req.body;
    if (!ID)
        return res.status(400).json({ Error: "Falta ID" });
    if (!await promoExiste(ID))
        return res.status(404).json({ Error: "Promo inexistente" });

    await dbRun(`DELETE FROM Carrito WHERE ID_Promo = ?`, [ID]);
    await dbRun(`DELETE FROM Promos WHERE ID = ?`, [ID]);

    return res.status(200).json({ Mensaje: "Promo eliminada", PromoID: ID });
}

module.exports = {
    ObtenerProductos,
    ObtenerPromos,
    AñadirProducto,
    ModificarProducto,
    EliminarProducto,
    AñadirPromo,
    ModificarPromo,
    EliminarPromo,
    ObtenerCategorias
}