const {dbGet, dbAll, dbRun} = require("../Utils/Querys")

async function ProductoExiste(ID)
{
    const query = "SELECT * FROM Productos WHERE ID = ?";
    const Producto = await dbGet(query, [ID]);
    return Producto != false;
}

async function PromoExiste(ID)
{
    const query = "SELECT * FROM Promos WHERE ID = ?";
    const Promo = await dbGet(query, [ID]);
    return Promo != false;
}

async function ObtenerProductos(req, res)
{
    const query = "SELECT * FROM Productos";
    Productos = await dbAll(query);
    if(!Productos)
        return res.status(500).json({Error: "Error en Server o Query"});
    Productos.map((Producto) => {
        Producto.Imagen = Producto.Imagen.toString("base64");
    });
    return res.status(201).json(Productos);
}

async function ObtenerPromos(req, res) {
    const query = `
        SELECT
            Productos.ID AS ProductoID,
            Productos.Nombre AS ProductoNombre,
            Productos.Precio AS ProductoPrecio,
            Productos.Imagen AS ProductoImagen,
            Productos.Stock AS ProductoStock,
            Productos.Descripcion AS ProductoDescripcion,
            Promos.ID AS PromoID,
            Promos.Nombre AS PromoNombre,
            Promos.Precio AS PromoPrecio,
            Promos.Imagen AS PromoImagen,
            Promos.Descripcion AS PromoDescricion,
            PromosProductos.Cantidad
        FROM PromosProductos
        LEFT JOIN Productos ON PromosProductos.ID_Producto = Productos.Id
        LEFT JOIN Promos ON PromosProductos.ID_Promo = Promos.ID
        ORDER BY Promos.ID;
    `;

    const filas = await dbAll(query);
    if(!filas) return res.status(500).json({Error: "Error en Server o Query"});

    // Agrupamos por promo
    const promosMap = {};
    filas.forEach(fila => {
        const promoID = fila.PromoID;

        if (!promosMap[promoID]) {
            promosMap[promoID] = {
                ID: fila.PromoID,
                Nombre: fila.PromoNombre,
                Precio: fila.PromoPrecio,
                Imagen: fila.PromoImagen.toString("base64"),
                Descripcion: fila.PromoDescripcion,
                Productos: []
            };
        }

        promosMap[promoID].Productos.push({
            ID: fila.ProductoID,
            Nombre: fila.ProductoNombre,
            Precio: fila.ProductoPrecio,
            Imagen: fila.ProductoImagen.toString("base64"),
            Stock: fila.ProductoStock,
            Descripcion: fila.ProductoDescripcion,
            Cantidad: fila.Cantidad
        });
    });

    // Convertimos el objeto a array
    const promos = Object.values(promosMap);
    return res.status(201).json(promos);
}

// Añade un nuevo producto a la base de datos
async function AñadirProducto(req, res)
{
    const {Nombre, Precio, Stock, Descripcion} = req.body;
    const ID_Promo = req.body.ID_Promo || -1; // Si no se envia, se pone -1, osea, sin promo
    const Imagen = req.file ? req.file.buffer : null;
    if (!Nombre || !Precio || !Imagen || !Stock || !Descripcion)
        return res.status(400).json({Error: "Faltan datos"});
    const query = `
        INSERT INTO Productos (Nombre, Precio, Imagen, Stock, Descripcion, ID_Promo)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const Error = await dbRun(query, [Nombre, Precio, Imagen, Stock, Descripcion, ID_Promo]);
    if(Error)
        return res.status(500).json({Error: "Error en Servidor"});
    return res.status(201).json({
        Mensaje: "Producto añadido",
        Nombre, Precio, Stock
    });
}

// Modifica un producto en la base de datos (un poco obvio lo se XD)
async function ModificarProducto(req, res)
{
    const {ID, Nombre, Precio, Stock, Descripcion, ID_Promo} = req.body;
    const Imagen = req.file ? req.file.buffer : null;
    if (!ID || !Nombre || !Precio || !Stock || !Descripcion)
        return res.status(400).json({Error: "Faltan datos"});
    if(!await ProductoExiste(ID))
        return res.status(404).json({Error: "Producto inexistente"});
    
    let query;
    let params;
    
    if (Imagen) {
        // Si hay una nueva imagen, actualizarla también
        query = `
            UPDATE Productos
            SET Nombre = ?, Precio = ?, Imagen = ?, Stock = ?, Descripcion = ?, ID_Promo = ?
            WHERE ID = ?
        `;
        params = [Nombre, Precio, Imagen, Stock, Descripcion, ID_Promo || -1, ID];
    } else {
        // Si no hay nueva imagen, mantener la existente
        query = `
            UPDATE Productos
            SET Nombre = ?, Precio = ?, Stock = ?, Descripcion = ?, ID_Promo = ?
            WHERE ID = ?
        `;
        params = [Nombre, Precio, Stock, Descripcion, ID_Promo || -1, ID];
    }
    
    const Error = await dbRun(query, params);
    if(Error)
        return res.status(500).json({Error: "Error en Servidor"});
    return res.status(201).json({
        Mensaje: "Producto modificado",
        Nombre, Precio, Stock
    });
}

// Elimina un producto de la base de datos
async function EliminarProducto(req, res)
{
    const {ID} = req.body;
    if(!ID)
        return res.status(400).json({Error: "Falta ID"});
    const Producto = await dbGet(`SELECT * FROM Productos WHERE ID = ?`, [ID]);
    if(!Producto)
        return res.status(404).json({ Error: "Producto inexistente"});
    // Borrar referencias en Carrito
    await dbRun(`DELETE FROM Carrito WHERE ID_Producto = ?`, [ID]);
    await dbRun(`DELETE FROM Productos WHERE ID = ?`, [ID]);
    return res.status(200).json({Mensaje: "Producto eliminado", ProductoID: ID});
}

// Añade una promo a la base de datos (dah 🙄)
async function AñadirPromo(req, res) {
    const { Nombre, Precio } = req.body;
    const Imagen = req.file ? req.file.buffer : null;
    if (!Nombre || !Precio || !Imagen)
        return res.status(400).json({Error: "Faltan datos"});
    const query = `INSERT INTO Promos (Nombre, Precio, Imagen) VALUES (?, ?, ?)`;
    const Error = await dbRun(query, [Nombre, Precio, Imagen]);
    if(Error)
        return res.status(500).json({Error: "Error en Servidor"});
    return res.status(201).json({Mensaje: "Promo añadida", Nombre, Precio});
}

// Modifica una promo de la base de datos (cuantas veces tendre que hacer esto? XD)
async function ModificarPromo(req, res)
{
    const {ID, Nombre, Precio} = req.body;
    const Imagen = req.file ? req.file.buffer : null;
    if(!ID || !Nombre || !Precio || !Imagen)
        return res.status(400).json({Error: "Faltan datos"});
    if(!await PromoExiste(ID))
        return res.status(404).json({ Error: "Promo inexistente" });
    const query = `
        UPDATE Promos
        SET Nombre = ?, Precio = ?, Imagen = ?
        WHERE ID = ?`;
    const Error = await dbRun(query, [Nombre, Precio, Imagen, ID]);
    if(Error)
        return res.status(500).json({ Error: "Error en Servidor" });
    return res.status(200).json({ Mensaje: "Promo modificada", PromoID: ID, Nombre, Precio });
}

// Elimina una promo de la base de datos
async function EliminarPromo(req, res)
{
    const {ID} = req.body;
    if(!ID)
        return res.status(400).json({Error: "Falta ID"});
    const Promo = await dbGet(`SELECT * FROM Promos WHERE ID = ?`, [ID]);
    if(!Promo)
        return res.status(404).json({ Error: "Promo inexistente"});
    // Borrar referencias en Carrito
    await dbRun(`DELETE FROM Carrito WHERE ID_Promo = ?`, [ID]);
    await dbRun(`DELETE FROM Promos WHERE ID = ?`, [ID]);
    return res.status(200).json({Mensaje: "Promo eliminada", PromoID: ID});
}

module.exports = {
    ObtenerProductos,
    ObtenerPromos,
    AñadirProducto,
    ModificarProducto,
    EliminarProducto,
    AñadirPromo,
    ModificarPromo,
    EliminarPromo
}