const {dbGet, dbAll, dbRun} = require("../Utils/Querys")

async function ClienteExiste(ID)
{
    const query = "SELECT * FROM Cliente WHERE ID = ?";
    const Cliente = await dbGet(query, [ID]);
    return Cliente != false;
}

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

// Obtiene el Carrito de un cliente :D
/*
    Devuelve los datos en un array asi:
    [
        {
            "ID_Carrito": 1,
            "ID_Producto": 5,
            "ProductoNombre": "Whisky",
            "ProductoPrecio": 1200,
            "ProductoDescripcion": "Un buen whisky",
            "ProductoImagen": AlgunaImagen.png
            "Cantidad": 2,
            "ID_Promo": -1,
            "PromoNombre": null,
            "PromoPrecio": null
        },
        {
            "ID_Carrito": 2,
            "ID_Producto": -1,
            "ProductoNombre": null,
            "ProductoPrecio": null,
            "ProductoDescripcion": null,
            "Cantidad": 1,
            "ID_Promo": 3,
            "PromoNombre": "Combo Alcohilo XD",
            "PromoPrecio": 9999
        }
    ]
    Si queres saber si un elemento es producto o promo, solo compara si ID_Promo == -1.
    por ejemplo:
    const Carrito = await axios.post("http://localhost:3000/api/ObtenerCarrito", {ClienteID});
    Carrito.data.forEach((Item) => {
        if(Item.ID_Promo == -1)
            console.log("Es un producto:", Item.ProductoNombre);
        else
            console.log("Es una promo:", Item.PromoNombre);
    });
}
*/
async function ObtenerCarrito(req, res)
{
    const {ID_Cliente} = req.body;
    if(!ID_Cliente)
        return res.status(400).json({Error: "Falta ID del cliente"});
    const query = `
        SELECT
            Carrito.ID AS ID_Carrito,
            Carrito.ID_Producto,
            Productos.Nombre AS ProductoNombre,
            Productos.Precio AS ProductoPrecio,
            Productos.Imagen AS ProductoImagen,
            Productos.Descripcion AS ProductoDescripcion,
            Carrito.Cantidad,
            Carrito.ID_Promo,
            Promos.Nombre AS PromoNombre,
            Promos.Precio AS PromoPrecio
        FROM Carrito
        LEFT JOIN Productos ON Carrito.ID_Producto = Productos.ID
        LEFT JOIN Promos ON Carrito.ID_Promo = Promos.ID
        WHERE Carrito.ID_Cliente = ?
    `;
    const Carrito = await dbAll(query, [ID_Cliente]);
    Carrito.map((Item) => {
        Item.ProductoImagen = Item.ProductoImagen.toString("base64");
    })
    return res.status(200).json(Carrito);
}

// Añade un producto al carrito del cliente
async function AñadirProdCarrito(req, res)
{
    const {ID_Cliente, ID_Producto} = req.body;
    if(!ID_Cliente || !ID_Producto)
        return res.status(400).json({Error: "Faltan ID_Cliente o ID_Producto"});
    // Verificamos si Cliente y Producto existen
    if(!await ClienteExiste(ID_Cliente))
        return res.status(404).json({Error: "Cliente inexistente", ID_Cliente});
    if(!await ProductoExiste(ID_Producto))
        return res.status(404).json({Error: "Producto inexistente", ID_Producto});
    // Verificamos si el producto ya esta en el carrito
    query = `
        SELECT * FROM Carrito 
        WHERE ID_Producto = ? AND ID_Cliente = ?
    `;
    const Item = await dbGet(query, [ID_Producto, ID_Cliente]);
    if(Item)
    {
        // Si ya existe, solo aumentamos la cantidad
        const nuevaCantidad = Item.Cantidad + 1;
        query = `
            UPDATE Carrito SET Cantidad = ?
            WHERE ID = ?
        `;
        await dbRun(query, [nuevaCantidad, Item.ID]);
    }
    else
    {
        // Si no existe, lo insertamos con cantidad 1
        query = `
            INSERT INTO Carrito(ID_Producto, ID_Promo, ID_Cliente, Cantidad) 
            VALUES (?, -1, ?, 1)
        `;
        await dbRun(query, [ID_Producto, ID_Cliente]);
    }
    return res.status(201).json({Mensaje: "Producto añadido al carrito"});
}

// Elimina un producto del carrito del cliente
// Si el producto tiene cantidad > 1, solo disminuye la cantidad
// Si la cantidad es 1, elimina el producto del carrito
// Si vos envias Eliminar=true en el body, elimina el producto sin importar la cantidad
async function EliminarProdCarrito(req, res)
{
    const {ID_Cliente, ID_Producto, Eliminar} = req.body;
    if(!ID_Cliente || !ID_Producto)
        return res.status(400).json({Error: "Faltan ID_Cliente o ID_Producto"});
    if(!await ClienteExiste(ID_Cliente))
        return res.status(404).json({Error: "Cliente inexistente"});
    if(!await ProductoExiste(ID_Producto))
        return res.status(404).json({Error: "Producto inexistente"});
    let query = `
        SELECT * FROM Carrito 
        WHERE ID_Producto = ? AND ID_Cliente = ?
    `;
    const Item = await dbGet(query, [ID_Producto, ID_Cliente]);
    if(!Item)
        return res.status(404).json({Error: "El cliente no tiene ese producto en el carrito"});
    if(Item.Cantidad > 1 && !Eliminar)
    {
        // Si la cantidad es mayor a 1, solo disminuimos la cantidad
        const nuevaCantidad = Item.Cantidad - 1;
        query = `
            UPDATE Carrito SET Cantidad = ?
            WHERE ID = ?
        `;
        await dbRun(query, [nuevaCantidad, Item.ID]);
        return res.status(200).json({Mensaje: "Cantidad de producto disminuida"});
    }
    else
    {
        // Si la cantidad es 1 o 'Eliminar' es verdadero, eliminamos el item del carrito
        query = "DELETE FROM Carrito WHERE ID = ?";
        await dbRun(query, [Item.ID]);
        return res.status(200).json({Mensaje: "Producto eliminado del carrito"});
    }
}

async function VaciarCarrito(req, res)
{
    const {ID_Cliente} = req.body;
    if(!ID_Cliente)
        return res.status(400).json({Error: "Faltan ID_Cliente o ID_Producto"});
    if(!await ClienteExiste(ID_Cliente))
        return res.status(404).json({Error: "Cliente inexistente"});
    let query = "DELETE FROM Carrito WHERE ID_Cliente = ?";
    let Error = await dbRun(query, [ID_Cliente]);
    if(Error)
        return res.status(404).json({Error: "Error en Servidor"});
    return res.status(200).json({
        Mensaje: "Vacio de Carrito exitoso"
    });
}

// Añade una promo al carrito del cliente
async function AñadirPromCarrito(req, res)
{
    const {ID_Cliente, ID_Promo} = req.body;
    if(!ID_Cliente || !ID_Promo)
        return res.status(400).json({Error: "Faltan ID_Cliente o ID_Promo"});
    if(!await ClienteExiste(ID_Cliente))
        return res.status(404).json({Error: "Cliente inexistente", ID_Cliente});
    if(!await PromoExiste(ID_Promo))
        return res.status(404).json({Error: "Promo inexistente", ID_Promo});
    // Verificar si ya esta en carrito
    let query = `
        SELECT * FROM Carrito
        WHERE ID_Promo = ? AND ID_Cliente = ?
    `;
    const Item = await dbGet(query, [ID_Promo, ID_Cliente]);
    if(Item)
    {
        const nuevaCantidad = Item.Cantidad + 1;
        query = `
            UPDATE Carrito SET Cantidad = ?
            WHERE ID = ?
        `;
        await dbRun(query, [nuevaCantidad, Item.ID]);
    }
    else
    {
        query = `
            INSERT INTO Carrito(ID_Producto, ID_Promo, ID_Cliente, Cantidad) 
            VALUES (-1, ?, ?, 1)
        `;
        await dbRun(query, [ID_Promo, ID_Cliente]);
    }
    return res.status(201).json({Mensaje: "Promo añadido al carrito"});
}

// Elimina una promo del carrito del cliente
// Si la promo tiene cantidad > 1, solo disminuye la cantidad
// Si la cantidad es 1, elimina la promo del carrito
// Si vos envias Eliminar=true en el body, elimina la promo sin importar la cantidad
// No se para que repito pero ante la duda lo dejo :D
async function EliminarPromCarrito(req, res)
{
    const {ID_Cliente, ID_Promo, Eliminar} = req.body;
    if(!ID_Carrito || !ID_Cliente)
        return res.status(400).json({Error: "Faltan ID_Carrito o ID_Cliente"});
    if(!await ClienteExiste(ID_Cliente))
        return res.status(404).json({Error: "Cliente inexistente"});
    if(!await PromoExiste(ID_Producto))
        return res.status(404).json({Error: "Promo inexistente"});
    let query = `
        SELECT * FROM Carrito 
        WHERE ID_Promo = ? AND ID_Cliente = ?
    `;
    const Item = await dbGet(query, [ID_Promo, ID_Cliente]);
    if(!Item)
        return res.status(404).json({Error: "El cliente no tiene esa promo en el carrito"});
    if(Item.Cantidad > 1 && !Eliminar)
    {
        const nuevaCantidad = Item.Cantidad - 1;
        query = `
            UPDATE Carrito SET Cantidad = ?
            WHERE ID = ?
        `;
        await dbRun(query, [nuevaCantidad, Item.ID]);
        return res.status(200).json({Mensaje: "Cantidad de promo disminuida"});
    }
    else
    {
        query = "DELETE FROM Carrito WHERE ID = ?";
        await dbRun(query, [Item.ID]);
        return res.status(200).json({Mensaje: "Promoeliminado del carrito"});
    }
}

module.exports = {
    ObtenerCarrito,
    AñadirProdCarrito,
    EliminarProdCarrito,
    VaciarCarrito,
    AñadirPromCarrito,
    EliminarPromCarrito
}