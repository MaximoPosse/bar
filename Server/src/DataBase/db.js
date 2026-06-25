/**
 * Configuración de la Base de Datos SQLite
 * 
 * Crea la conexión con la base de datos y define todas las tablas
 * del sistema (Clientes, Empleados, Productos, Promos, Carrito, Compras).
 */

const SQLite = require('sqlite3')
const path = require('path')

const dbUbicacion = path.resolve(__dirname, './Sistema.db')

/**
 * Crea todas las tablas si no existen.
 * También intenta agregar columnas nuevas para compatibilidad con versiones anteriores.
 */
function CrearTablas(db) {
    function CheckError(Error, Message) {
        if (Error)
            console.error('Error: ' + Message + '\n', Error)
    }

    // Tabla: Clientes del sistema (usuarios finales)
    db.run(`
        CREATE TABLE IF NOT EXISTS "Cliente" (
            "Id"            INTEGER,
            "Nombre"        TEXT UNIQUE,
            "Correo"        TEXT,
            "Contraseña"    TEXT,
            "Rostro"        TEXT,
            PRIMARY KEY("Id" AUTOINCREMENT)
        );
    `, (Error) => CheckError(Error, "Tabla Clientes no creada"));

    // Tabla: Empleados/Administradores del sistema
    db.run(`
        CREATE TABLE IF NOT EXISTS "Empleado" (
            "ID"            INTEGER,
            "Nombre"        TEXT,
            "Correo"        TEXT,
            "Contraseña"    TEXT,
            "Rol"           TEXT DEFAULT 'Admin',
            PRIMARY KEY("ID" AUTOINCREMENT)
        );
    `, (Error) => CheckError(Error, "Tabla Empleados no creada"));

    // Compatibilidad: agrega columna Rol si no existe
    db.run(`ALTER TABLE Empleado ADD COLUMN Rol TEXT DEFAULT 'Admin'`, (Error) => {});

    // Tabla: Promociones
    db.run(`
        CREATE TABLE IF NOT EXISTS "Promos" (
            "ID"            INTEGER,
            "Nombre"        TEXT,
            "Precio"        REAL,
            "Imagen"        BLOB,
            "Descripcion"   TEXT,
            PRIMARY KEY("ID" AUTOINCREMENT)
        );
    `, (Error) => CheckError(Error, "Tabla Promos no creada"));

    // Tabla: Productos (cada uno puede pertenecer a una promo)
    db.run(`
        CREATE TABLE IF NOT EXISTS "Productos" (
            "ID"            INTEGER,
            "Nombre"        TEXT,
            "Precio"        REAL,
            "Imagen"        BLOB,
            "Stock"         INTEGER,
            "Descripcion"   TEXT,
            "ID_Promo"      INTEGER,
            "Categoria"     TEXT DEFAULT 'Bebidas',
            PRIMARY KEY("ID"),
            FOREIGN KEY("ID_Promo") REFERENCES "Promos"("ID")
        );
    `, (Error) => CheckError(Error, "Tabla Productos no creada"));

    // Compatibilidad: agrega columna Categoria si no existe
    db.run(`ALTER TABLE Productos ADD COLUMN Categoria TEXT DEFAULT 'Bebidas'`, (Error) => {});

    // Tabla: Carrito de compras (relaciona clientes con productos/promos)
    db.run(`
        CREATE TABLE IF NOT EXISTS "Carrito" (
            "ID"            INTEGER,
            "ID_Producto"   INTEGER,
            "ID_Promo"      INTEGER,
            "ID_Cliente"    INTEGER,
            "Cantidad"      INTEGER,
            PRIMARY KEY("ID" AUTOINCREMENT),
            FOREIGN KEY("ID_Cliente")  REFERENCES "Cliente"("ID"),
            FOREIGN KEY("ID_Producto") REFERENCES "Productos"("ID"),
            FOREIGN KEY("ID_Promo")    REFERENCES "Promos"("ID")
        );
    `, (Error) => CheckError(Error, "Tabla Carrito no creada"));

    // Tabla: Historial de compras
    db.run(`
        CREATE TABLE IF NOT EXISTS "Compra" (
            "ID"            INTEGER,
            "Fecha"         TEXT,
            "Hora"          TEXT,
            "Monto_Total"   INTEGER,
            "ID_Carrito"    INTEGER,
            PRIMARY KEY("ID" AUTOINCREMENT),
            FOREIGN KEY("ID_Carrito") REFERENCES "Carrito"("ID")
        );
    `, (Error) => CheckError(Error, "Tabla Compra no creada"));
}

/**
 * Crea los usuarios por defecto (superadmin, admin) si no existen.
 * Se ejecuta con un retraso para asegurar que las tablas ya estén creadas.
 */
function InicializarUsuarios() {
    const { crearUsuariosIniciales } = require('../Utils/initUsers');
    setTimeout(() => {
        crearUsuariosIniciales().catch(err => {
            console.error('Error al inicializar usuarios:', err);
        });
    }, 1000);
}

// Inicializar conexión a la base de datos
const db = new SQLite.Database(dbUbicacion, (Error) => {
    if (Error)
        console.error('No se pudo crear la base de datos')
    else {
        console.log('Base de datos creada/conectada')
        CrearTablas(db);
        setTimeout(() => {
            InicializarUsuarios();
        }, 500);
    }
})

module.exports = db;
