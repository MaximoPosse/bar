
// ---> Utilizamos la Dependencia sqlite3
const SQLite = require('sqlite3')

// ---> Utilizamos "PATH" para indicar ubicacion
const path= require('path')

// ---> Ubicación de la Base de Datos
const dbUbicacion = path.resolve(__dirname,'./Sistema.db')

function CrearTablas(db)
{
    // Verifica si hubo un error y si lo hay, lanza un error con el mensaje
    function CheckError(Error, Message)
    {
        if(Error)
            console.error(`❗ Error: ${Message}\n`, Error)
    }
    // Tabla Cliente
    db.run(`
        CREATE TABLE IF NOT EXISTS "Cliente" (
	        "Id"	INTEGER,
	        "Nombre"	TEXT UNIQUE,
	        "Correo"	TEXT,
	        "Contraseña"	TEXT,
	        PRIMARY KEY("Id" AUTOINCREMENT)
        );
    `, (Error) => CheckError(Error, "Tabla Clientes no creada"));
    // Tabla Empleado
    db.run(`
        CREATE TABLE IF NOT EXISTS "Empleado" (
	        "ID"	INTEGER,
	        "Nombre"	TEXT,
	        "Correo"	TEXT,
	        "Contraseña"	TEXT,
	        "Rol"	TEXT DEFAULT 'Admin',
	        PRIMARY KEY("ID" AUTOINCREMENT)
        );
    `, (Error) => CheckError(Error, "Tabla Empleados no creada"));
    // Agregar columna Rol si no existe (para bases de datos existentes)
    db.run(`
        ALTER TABLE Empleado ADD COLUMN Rol TEXT DEFAULT 'Admin'
    `, (Error) => {
        // Ignorar error si la columna ya existe
    });
    // Tabla Promos
    db.run(`
        CREATE TABLE IF NOT EXISTS "Promos" (
	        "ID"	INTEGER,
	        "Nombre"	TEXT,
            "Precio"	REAL,
            "Imagen"    BLOB,
            "Descripcion" TEXT,
	        PRIMARY KEY("ID" AUTOINCREMENT)
        );
    `, (Error) => CheckError(Error, "Tabla Promos no creada"));
    // Tabla Productos
    db.run(`
        CREATE TABLE IF NOT EXISTS "Productos" (
	        "ID"	INTEGER,
	        "Nombre"	TEXT,
	        "Precio"	REAL,
            "Imagen"    BLOB,
	        "Stock"	INTEGER,
	        "Descripcion"	TEXT,
	        "ID_Promo"	INTEGER,
	        PRIMARY KEY("ID"),
	        FOREIGN KEY("ID_Promo") REFERENCES "Promos"("ID")
        );
    `, (Error) => CheckError(Error, "Tabla Productos no creada"));
    // Tabla Carrito
    db.run(`
        CREATE TABLE IF NOT EXISTS "Carrito" (
	        "ID"	INTEGER,
	        "ID_Producto"	INTEGER,
	        "ID_Promo"	INTEGER,
	        "ID_Cliente"	INTEGER,
            "Cantidad" INTEGER,
	        PRIMARY KEY("ID" AUTOINCREMENT),
	        FOREIGN KEY("ID_Cliente") REFERENCES "Cliente"("ID"),
	        FOREIGN KEY("ID_Producto") REFERENCES "Productos"("ID"),
	        FOREIGN KEY("ID_Promo") REFERENCES "Promos"("ID")
        );
    `, (Error) => CheckError(Error, "Tabla Carrito no creada"));
    // Tabla Compra
    db.run(`
        CREATE TABLE IF NOT EXISTS "Compra" (
	        "ID"	INTEGER,
	        "Fecha"	TEXT,
	        "Hora"	TEXT,
	        "Monto_Total"	INTEGER,
	        "ID_Carrito"	INTEGER,
	        PRIMARY KEY("ID" AUTOINCREMENT),
	        FOREIGN KEY("ID_Carrito") REFERENCES "Carrito"("ID")
        );
    `, (Error) => CheckError(Error, "Tabla Compra no creada"));
}

// Función para inicializar usuarios por defecto
function InicializarUsuarios(db) {
    const { crearUsuariosIniciales } = require('../Utils/initUsers');
    
    // Esperar un poco más para asegurar que las tablas estén creadas
    setTimeout(() => {
        crearUsuariosIniciales().catch(err => {
            console.error('Error al inicializar usuarios:', err);
        });
    }, 1000);
}

const db = new SQLite.Database(dbUbicacion, (Error)=>{
    if(Error)
        console.error('No se Pudo Crear la Base de Datos ⛔')
    else
    {
        console.log('✅ Base de Datos Creada')
        CrearTablas(db);
        // Inicializar usuarios después de crear las tablas
        setTimeout(() => {
            InicializarUsuarios(db);
        }, 500);
    }
})

module.exports=db;
