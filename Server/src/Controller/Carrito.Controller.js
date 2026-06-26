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

async function RecuperarCarrito(ID_Cliente)
{
    return await dbAll(`
        SELECT
            Carrito.ID AS ID_Carrito,
            Carrito.ID_Producto,
            Productos.Nombre AS ProductoNombre,
            Productos.Precio AS ProductoPrecio,
            Productos.Imagen AS ProductoImagen,
            Productos.Descripcion AS ProductoDescripcion,
            Productos.Stock AS ProductoStock,
            Carrito.Cantidad,
            Carrito.ID_Promo,
            Promos.Nombre AS PromoNombre,
            Promos.Precio AS PromoPrecio
        FROM Carrito
        LEFT JOIN Productos ON Carrito.ID_Producto = Productos.ID
        LEFT JOIN Promos ON Carrito.ID_Promo = Promos.ID
        WHERE Carrito.ID_Cliente = ?
    `, [ID_Cliente]);
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
            Promos.Precio AS PromoPrecio,
            Promos.Imagen AS PromoImagen
        FROM Carrito
        LEFT JOIN Productos ON Carrito.ID_Producto = Productos.ID
        LEFT JOIN Promos ON Carrito.ID_Promo = Promos.ID
        WHERE Carrito.ID_Cliente = ?
    `;
    const Carrito = await dbAll(query, [ID_Cliente]);
    Carrito.map((Item) => {
        if(Item.ID_Promo === -1)
            Item.ProductoImagen = Item.ProductoImagen.toString("base64");
        else
            Item.PromoImagen = Item.PromoImagen.toString("base64");
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
    const Cliente = await dbGet(`SELECT * FROM Cliente WHERE Id = ?`, [ID_Cliente]);
    if(!Cliente)
        return res.status(404).json({Error: "Cliente inexistente", ID_Cliente});
    if(Cliente.ProcesandoOrden)
        return res.status(404).json({Error: "Se esta procesando la orden"});
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
    if(!ID_Cliente)
        return res.status(400).json({Error: "Faltan ID_Cliente"});
    if(!await ClienteExiste(ID_Cliente))
        return res.status(404).json({Error: "Cliente inexistente"});
    if(!await PromoExiste(ID_Promo))
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

async function RealizarPedido(req, res)
{
    const {ID_Cliente} = req.body;
    if(!await ClienteExiste(ID_Cliente))
        return res.status(404).json({Error: "Cliente inexistente"});
    let precioFinal = 0;
    const ItemsCarrito = await dbAll(`
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
    `, [ID_Cliente])
    ItemsCarrito.map(Item => {
        if(Item.ID_Promo === -1)
            precioFinal += Item.ProductoPrecio * Item.Cantidad;
        else
            precioFinal += Item.PromoPrecio * Item.Cantidad;
    });
    console.log(ItemsCarrito);
    const Fechita = new Date();
    // Basicamente, el formato le puse: Dia/Mes/Año
    const fecha = `${Fechita.getDate()}/${Fechita.getMonth()}/${Fechita.getFullYear()}`;
    // El formato aca le puse: Hora:Minutos
    const hora = `${Fechita.getHours()}:${Fechita.getMinutes()}`
    dbRun(`
        INSERT INTO Compra(Fecha, Hora, Monto_Total, ID_Cliente)
        VALUES (?, ?, ?, ?)
    `, [fecha, hora, precioFinal, ID_Cliente]);
    dbRun(`
        UPDATE Cliente
        SET ProcesandoOrden = 1
        WHERE Id = ?
    `, [ID_Cliente]);
    // No hago await aca porque total quedan en segundo plano
    // Y estoy seguro de que no va a dar error :D
    return res.status(200).json({success: true, Mensaje: "Pedido Realizado"});
}

async function CancelarPedido(req, res) {
    const {ID_Cliente} = req.body;
    await dbRun(`
        DELETE FROM Compra
        WHERE ID_Cliente = ?
    `, [ID_Cliente])
    await dbRun(`
        UPDATE Cliente
        SET ProcesandoOrden = 0
        WHERE Id = ?
    `, [ID_Cliente]);
    return res.status(200).json({success: true, Mensaje: "Pedido Cancelado"});
}

async function ObtenerPedidos(req, res)
{
    const query = `
        SELECT
            Compra.ID,
            Compra.Fecha,
            Compra.Hora,
            Compra.Monto_Total,
            Compra.ID_Cliente,
            Cliente.Nombre AS ClienteNombre
        FROM Compra
        LEFT JOIN Cliente ON Compra.ID_Cliente = Cliente.Id
    `
    const Pedidos = await dbAll(query);
    return res.status(200).json(Pedidos);
}

async function ProcesarPedido(req, res)
{
    const {ID_Pedido} = req.body;
    const Pedido = await dbGet(`
        SELECT * FROM Compra
        WHERE ID = ?
    `, [ID_Pedido]);
    console.log(Pedido)
    if(!Pedido)
        return res.status(404).json({success: false, Mensaje: "Pedido Inexistente"});
    await dbRun(`
        DELETE FROM Compra
        WHERE ID = ?
    `, [ID_Pedido]);
    const Carrito = await RecuperarCarrito(Pedido.ID_Cliente);
    await Carrito.map(async Item => {
        if(Item.ID_Promo === -1)
        {
            let nuevaStock = Item.ProductoStock - Item.Cantidad;
            console.log(Item, nuevaStock)
            await dbRun(`
                UPDATE Productos
                SET Stock = ?
                WHERE ID = ?
            `, [nuevaStock, Item.ID_Producto]);
        }
    })
    await dbRun(`
        DELETE FROM Carrito
        WHERE ID_Cliente = ?
    `, [Pedido.ID_Cliente]);
    await dbRun(`
        UPDATE Cliente SET ProcesandoOrden = 0
        WHERE Id = ?
    `, [Pedido.ID_Cliente]);
    return res.status(200).json({success: true, Mensaje: "Borrado Exitoso"});
}

async function ActualizarCarrito(req, res) {
  const { ID_Cliente } = req.body;
  if (!ID_Cliente) return res.status(400).json({ error: 'Falta ID_Cliente' });

  try {
    // 1) Obtener cantidades actuales por producto en el carrito del cliente
    const carritoPorProducto = await dbAll(
      `SELECT ID_Producto, SUM(Cantidad) AS Cantidad
       FROM Carrito
       WHERE ID_Cliente = ? AND ID_Producto IS NOT NULL
       GROUP BY ID_Producto`, [ID_Cliente]
    );
    // convertir a map {idProducto: cantidad}
    const cartQtyMap = {};
    carritoPorProducto.forEach(r => { cartQtyMap[r.ID_Producto] = r.Cantidad; });

    // 2) Obtener todas las promos y sus requisitos (PromosProductos)
    const promosRows = await dbAll(
      `SELECT pp.ID_Promo, pp.ID_Producto, pp.Cantidad AS ReqCantidad
       FROM PromosProductos pp
       ORDER BY pp.ID_Promo`
    );

    // Agrupar por promo
    const promos = {}; // { ID_Promo: { items: [{ID_Producto, ReqCantidad}], totalReq } }
    promosRows.forEach(r => {
      if (!promos[r.ID_Promo]) promos[r.ID_Promo] = { items: [], totalReq: 0 };
      promos[r.ID_Promo].items.push({ ID_Producto: r.ID_Producto, ReqCantidad: r.ReqCantidad });
      promos[r.ID_Promo].totalReq += r.ReqCantidad;
    });

    // 3) Decidir orden de aplicación de promos.
    //    Para minimizar conflictos usamos promos con más productos/requisitos primero.
    const promoList = Object.entries(promos)
      .map(([id, data]) => ({ ID_Promo: Number(id), ...data }))
      .sort((a, b) => b.totalReq - a.totalReq); // mayor primero

    // 4) Ejecutar dentro de TRANSACTION
    await dbRun('BEGIN TRANSACTION');

    for (const promo of promoList) {
      // Calcular cuántas veces se puede aplicar esta promo según cantidades actuales en cartQtyMap
      let maxTimes = Infinity;
      for (const it of promo.items) {
        const have = cartQtyMap[it.ID_Producto] || 0;
        const times = Math.floor(have / it.ReqCantidad);
        if (times < maxTimes) maxTimes = times;
      }
      if (!isFinite(maxTimes) || maxTimes <= 0) continue; // no aplicable

      const timesToApply = maxTimes; // aplicar la cantidad máxima posible

      // 4.a) Reducir cantidades en Carrito para cada producto requerido (timesToApply * req)
      for (const it of promo.items) {
        let toRemove = it.ReqCantidad * timesToApply;

        // Tomar las filas del carrito de ese producto (orden cronológico por ID)
        const filas = await dbAll(
          `SELECT ID, Cantidad FROM Carrito
           WHERE ID_Cliente = ? AND ID_Producto = ?
           ORDER BY ID`, [ID_Cliente, it.ID_Producto]
        );

        for (const fila of filas) {
          if (toRemove <= 0) break;
          if (fila.Cantidad > toRemove) {
            // actualizar fila reduciendo cantidad
            const nuevaCant = fila.Cantidad - toRemove;
            await dbRun(`UPDATE Carrito SET Cantidad = ? WHERE ID = ?`, [nuevaCant, fila.ID]);
            // actualizar map
            cartQtyMap[it.ID_Producto] = (cartQtyMap[it.ID_Producto] || 0) - (it.ReqCantidad * timesToApply - toRemove) - toRemove + toRemove; // ajuste redundante seguro
            toRemove = 0;
            break;
          } else {
            // eliminar fila completa
            await dbRun(`DELETE FROM Carrito WHERE ID = ?`, [fila.ID]);
            toRemove -= fila.Cantidad;
          }
        }

        // Si por alguna razón no se pudo remover suficiente (no debería pasar), forzamos el map a 0
        cartQtyMap[it.ID_Producto] = Math.max(0, (cartQtyMap[it.ID_Producto] || 0) - (it.ReqCantidad * timesToApply));
      }

      // 4.b) Insertar o actualizar la fila de Carrito para la promo
      const existingPromoRow = await dbGet(
        `SELECT ID, Cantidad FROM Carrito WHERE ID_Cliente = ? AND ID_Promo = ?`, [ID_Cliente, promo.ID_Promo]
      );
      if (existingPromoRow) {
        await dbRun(`UPDATE Carrito SET Cantidad = Cantidad + ? WHERE ID = ?`, [timesToApply, existingPromoRow.ID]);
      } else {
        await dbRun(`INSERT INTO Carrito (ID_Promo, ID_Cliente, Cantidad) VALUES (?, ?, ?)`, [promo.ID_Promo, ID_Cliente, timesToApply]);
      }
    }

    await dbRun('COMMIT');

    // 5) Devolver el carrito actualizado
    const carritoActual = await dbAll(`SELECT * FROM Carrito WHERE ID_Cliente = ? ORDER BY ID`, [ID_Cliente]);
    return res.json({ ok: true, carrito: carritoActual });

  } catch (err) {
    // intentar rollback si hay error
    try { await dbRun('ROLLBACK'); } catch (e) { /* ignore */ }
    console.error('Error actualizar carrito:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = {
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
}