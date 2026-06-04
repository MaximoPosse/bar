const { CompararPassword, EncriptarPassword } = require("../Utils/Hash");
const {enviarCorreo} = require("../Utils/Email");
const {dbGet, dbAll, dbRun} = require("../Utils/Querys");

// Para registrar un nuevo cliente
async function Registrarse(req, res)
{
    const {Nombre, Correo, Contraseña} = req.body;
    if(!Nombre || !Correo || !Contraseña)
        return res.status(400).json({Error: "Faltan datos (Nombre, Correo o Contraseña)"});
    const Existe = await dbGet(`SELECT * FROM Cliente WHERE Nombre = ?`, [Nombre]);
    if(Existe)
        return res.status(409).json({Error: "Nombre de usuario ya existente"});
    const Hash = await EncriptarPassword(Contraseña);
    const query = `
        INSERT INTO Cliente (Nombre, Correo, Contraseña)
        VALUES (?, ?, ?)
    `;
    const result = await dbRun(query, [Nombre, Correo, Hash]);
    return res.status(201).json({
        Mensaje: "Cliente registrado",
        Nombre,
        Correo
    });
}

// Para registrar un nuevo cliente
async function RegistrarseAdmin(req, res)
{
    const {Nombre, Correo, Contraseña} = req.body;
    if(!Nombre || !Correo || !Contraseña)
        return res.status(400).json({Error: "Faltan datos (Nombre, Correo o Contraseña)"});
    const Existe = await dbGet(`SELECT * FROM Empleado WHERE Nombre = ?`, [Nombre]);
    if(Existe)
        return res.status(409).json({Error: "Nombre de empleado ya existente"});
    const Hash = await EncriptarPassword(Contraseña);
    const query = `
        INSERT INTO Empleado (Nombre, Correo, Contraseña)
        VALUES (?, ?, ?)
    `;
    const result = await dbRun(query, [Nombre, Correo, Hash]);
    return res.status(201).json({
        Mensaje: "Empleado Registrado",
        Nombre,
        Correo
    });
}

// Para que se loguee el cliente
/* 
    Devuelve los datos asi por ejemplo:
    {
        Mensaje: "Login exitoso",
        Cliente: {
            Id: 9999,
            Nombre: "usuario1",
            Correo: "alguncorreo@gmail.com",
            Contraseña: "passwordHasheada"
        }
    }
*/
async function Login(req, res)
{
    const {Nombre, Contraseña} = req.body;
    if(!Nombre || !Contraseña)
        return res.status(400).json({Error: "Campos vacíos"})
    const query = `SELECT * FROM Cliente WHERE Nombre = ?`;
    const Cliente = await dbGet(query, [Nombre]);
    if(!Cliente) 
        return res.status(401).json({Error: "Usuario inexistente"});
    const Hashed = await CompararPassword(Contraseña, Cliente.Contraseña);
    if(!Hashed)
        return res.status(401).json({Error: "Contraseña incorrecta"});
    return res.status(200).json({
        Mensaje: "Login exitoso", 
        Cliente
    });
}

async function EnviarCorreo(req, res) {
    const {Destinatario, Asunto, Cuerpo} = req.body;
    const info = await enviarCorreo(Destinatario, Asunto, Cuerpo);
    if(!info.success)
        return res.status(500).json({Mensaje: "Error al enviar correo.", success: false});
    return res.status(200).json({
        Mensaje: "Correo enviado",
        success: true
    })
}

// Para que se loguee el empleado/admin
// Devuelve de la misma manera que Login pero con Empleado
async function LoginAdmin(req, res)
{
    const {Nombre, Contraseña} = req.body;
    if(!Nombre || !Contraseña)
        return res.status(400).json({Error: "Campos vacíos"});
    const Empleado = await dbGet(`SELECT * FROM Empleado WHERE Nombre = ?`, [Nombre]);
    if(!Empleado)
        return res.status(401).json({Error: "Empleado inexistente"});
    const Hashed = await CompararPassword(Contraseña, Empleado.Contraseña);
    if(!Hashed)
        return res.status(401).json({Error: "Contraseña incorrecta"});
    return res.status(200).json({
        Mensaje: "Login admin exitoso",
        Empleado
    });
}

// Obtener todos los administradores (solo SUPERADMIN puede ver esto)
async function ObtenerAdmins(req, res)
{
    try {
        const query = "SELECT ID, Nombre, Correo, COALESCE(Rol, 'Admin') as Rol FROM Empleado ORDER BY CASE WHEN Rol = 'SUPERADMIN' THEN 1 WHEN Rol = 'Admin' THEN 2 ELSE 3 END, Nombre";
        const Admins = await dbAll(query);
        // Si no hay admins o es un array vacío, devolver array vacío
        if(!Admins) {
            return res.status(200).json([]);
        }
        return res.status(200).json(Admins);
    } catch (error) {
        console.error('Error en ObtenerAdmins:', error);
        return res.status(500).json({Error: "Error en Server o Query", Detalle: error.message});
    }
}

// Eliminar un administrador (solo SUPERADMIN puede hacer esto)
async function EliminarAdmin(req, res)
{
    const {ID} = req.body;
    const {ID_Usuario} = req.body; // ID del usuario que hace la petición
    
    if(!ID)
        return res.status(400).json({Error: "Falta ID"});
    
    // Verificar que el usuario que hace la petición es SUPERADMIN
    if(ID_Usuario) {
        const Usuario = await dbGet(`SELECT * FROM Empleado WHERE ID = ?`, [ID_Usuario]);
        if(!Usuario || Usuario.Rol !== 'SUPERADMIN')
            return res.status(403).json({Error: "Solo el SUPERADMIN puede eliminar administradores"});
    }
    
    // Verificar que el admin a eliminar existe
    const Admin = await dbGet(`SELECT * FROM Empleado WHERE ID = ?`, [ID]);
    if(!Admin)
        return res.status(404).json({Error: "Administrador inexistente"});
    
    // No permitir eliminar al SUPERADMIN
    if(Admin.Rol === 'SUPERADMIN')
        return res.status(403).json({Error: "No se puede eliminar al SUPERADMIN"});
    
    await dbRun(`DELETE FROM Empleado WHERE ID = ?`, [ID]);
    return res.status(200).json({Mensaje: "Administrador eliminado", AdminID: ID});
}

// Endpoint temporal para crear usuarios iniciales (solo para desarrollo)
async function CrearUsuariosIniciales(req, res)
{
    try {
        const { crearUsuariosIniciales } = require('../Utils/initUsers');
        await crearUsuariosIniciales();
        return res.status(200).json({Mensaje: "Usuarios iniciales creados/verificados"});
    } catch (error) {
        return res.status(500).json({Error: "Error al crear usuarios", Detalle: error.message});
    }
}

module.exports = {
    Registrarse,
    RegistrarseAdmin,
    Login,
    EnviarCorreo,
    LoginAdmin,
    ObtenerAdmins,
    EliminarAdmin,
    CrearUsuariosIniciales
};