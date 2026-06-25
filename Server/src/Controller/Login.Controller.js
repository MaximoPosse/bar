/**
 * Controlador de Autenticación y Usuarios
 * 
 * Maneja el registro e inicio de sesión de clientes y administradores,
 * gestión de roles, reconocimiento facial y recuperación de contraseñas.
 */

const { CompararPassword, EncriptarPassword } = require("../Utils/Hash");
const { enviarCorreo } = require("../Utils/Email");
const { dbGet, dbAll, dbRun } = require("../Utils/Querys");

// ──────────────────────────────────────────────
//  CLIENTES
// ──────────────────────────────────────────────

/**
 * POST /api/registrarse
 * Registra un nuevo cliente en el sistema.
 * Body: { Nombre, Correo, Contraseña }
 */
async function Registrarse(req, res)
{
    const { Nombre, Correo, Contraseña } = req.body;
    if (!Nombre || !Correo || !Contraseña)
        return res.status(400).json({ Error: "Faltan datos (Nombre, Correo o Contraseña)" });

    const existe = await dbGet(`SELECT * FROM Cliente WHERE Nombre = ?`, [Nombre]);
    if (existe)
        return res.status(409).json({ Error: "Nombre de usuario ya existente" });

    const hash = await EncriptarPassword(Contraseña);
    await dbRun(`INSERT INTO Cliente (Nombre, Correo, Contraseña) VALUES (?, ?, ?)`, [Nombre, Correo, hash]);

    return res.status(201).json({ Mensaje: "Cliente registrado", Nombre, Correo });
}

/**
 * POST /api/login
 * Inicia sesión como cliente.
 * Body: { Nombre, Contraseña }
 * Res: { Mensaje, Cliente }
 */
async function Login(req, res)
{
    const { Nombre, Contraseña } = req.body;
    if (!Nombre || !Contraseña)
        return res.status(400).json({ Error: "Campos vacíos" });

    const cliente = await dbGet(`SELECT * FROM Cliente WHERE Nombre = ?`, [Nombre]);
    if (!cliente)
        return res.status(401).json({ Error: "Usuario inexistente" });

    const coincide = await CompararPassword(Contraseña, cliente.Contraseña);
    if (!coincide)
        return res.status(401).json({ Error: "Contraseña incorrecta" });

    return res.status(200).json({ Mensaje: "Login exitoso", Cliente: cliente });
}

/**
 * POST /api/cambiarcontraseña
 * Cambia la contraseña de un cliente.
 * Body: { Nombre, NuevaContraseña }
 */
async function CambiarContraseña(req, res) {
    const { Nombre, NuevaContraseña } = req.body;
    if (!Nombre || !NuevaContraseña)
        return res.status(400).json({ Error: "Faltan datos" });
    if (NuevaContraseña.length < 6)
        return res.status(400).json({ Error: "La contraseña debe tener al menos 6 caracteres" });

    const cliente = await dbGet(`SELECT * FROM Cliente WHERE Nombre = ?`, [Nombre]);
    if (!cliente)
        return res.status(404).json({ Error: "Usuario no encontrado" });

    const hash = await EncriptarPassword(NuevaContraseña);
    await dbRun(`UPDATE Cliente SET Contraseña = ? WHERE Nombre = ?`, [hash, Nombre]);
    return res.status(200).json({ Mensaje: "Contraseña actualizada correctamente" });
}

/**
 * GET /api/obteneremailcliente/:Nombre
 * Obtiene el correo electrónico de un cliente por su nombre de usuario.
 */
async function ObtenerEmailCliente(req, res) {
    const { Nombre } = req.params;
    if (!Nombre)
        return res.status(400).json({ Error: "Falta nombre de usuario" });

    const cliente = await dbGet(`SELECT Correo FROM Cliente WHERE Nombre = ?`, [Nombre]);
    if (!cliente)
        return res.status(404).json({ Error: "Usuario no encontrado" });

    return res.status(200).json({ Correo: cliente.Correo });
}

// ──────────────────────────────────────────────
//  ADMINISTRADORES
// ──────────────────────────────────────────────

/**
 * POST /api/registrarseadmin
 * Registra un nuevo empleado/administrador.
 * Body: { Nombre, Correo, Contraseña }
 */
async function RegistrarseAdmin(req, res)
{
    const { Nombre, Correo, Contraseña } = req.body;
    if (!Nombre || !Correo || !Contraseña)
        return res.status(400).json({ Error: "Faltan datos (Nombre, Correo o Contraseña)" });

    const existe = await dbGet(`SELECT * FROM Empleado WHERE Nombre = ?`, [Nombre]);
    if (existe)
        return res.status(409).json({ Error: "Nombre de empleado ya existente" });

    const hash = await EncriptarPassword(Contraseña);
    await dbRun(`INSERT INTO Empleado (Nombre, Correo, Contraseña) VALUES (?, ?, ?)`, [Nombre, Correo, hash]);

    return res.status(201).json({ Mensaje: "Empleado Registrado", Nombre, Correo });
}

/**
 * POST /api/loginadmin
 * Inicia sesión como empleado/administrador.
 * Body: { Nombre, Contraseña }
 * Res: { Mensaje, Empleado }
 */
async function LoginAdmin(req, res)
{
    const { Nombre, Contraseña } = req.body;
    if (!Nombre || !Contraseña)
        return res.status(400).json({ Error: "Campos vacíos" });

    const empleado = await dbGet(`SELECT * FROM Empleado WHERE Nombre = ?`, [Nombre]);
    if (!empleado)
        return res.status(401).json({ Error: "Empleado inexistente" });

    const coincide = await CompararPassword(Contraseña, empleado.Contraseña);
    if (!coincide)
        return res.status(401).json({ Error: "Contraseña incorrecta" });

    return res.status(200).json({ Mensaje: "Login admin exitoso", Empleado: empleado });
}

/**
 * GET /api/obteneradmins
 * Obtiene todos los administradores del sistema (solo SUPERADMIN).
 */
async function ObtenerAdmins(req, res)
{
    try {
        const query = `
            SELECT ID, Nombre, Correo, COALESCE(Rol, 'Admin') as Rol 
            FROM Empleado 
            ORDER BY 
                CASE 
                    WHEN Rol = 'SUPERADMIN' THEN 1 
                    WHEN Rol = 'Admin' THEN 2 
                    ELSE 3 
                END, 
                Nombre
        `;
        const admins = await dbAll(query);
        return res.status(200).json(admins || []);
    } catch (error) {
        console.error('Error en ObtenerAdmins:', error);
        return res.status(500).json({ Error: "Error en servidor", Detalle: error.message });
    }
}

/**
 * POST /api/eliminaradmin
 * Elimina un administrador (solo SUPERADMIN puede ejecutar).
 * Body: { ID, ID_Usuario }
 */
async function EliminarAdmin(req, res)
{
    const { ID, ID_Usuario } = req.body;

    if (!ID)
        return res.status(400).json({ Error: "Falta ID" });

    if (ID_Usuario) {
        const usuario = await dbGet(`SELECT * FROM Empleado WHERE ID = ?`, [ID_Usuario]);
        if (!usuario || usuario.Rol !== 'SUPERADMIN')
            return res.status(403).json({ Error: "Solo el SUPERADMIN puede eliminar administradores" });
    }

    const admin = await dbGet(`SELECT * FROM Empleado WHERE ID = ?`, [ID]);
    if (!admin)
        return res.status(404).json({ Error: "Administrador inexistente" });
    if (admin.Rol === 'SUPERADMIN')
        return res.status(403).json({ Error: "No se puede eliminar al SUPERADMIN" });

    await dbRun(`DELETE FROM Empleado WHERE ID = ?`, [ID]);
    return res.status(200).json({ Mensaje: "Administrador eliminado", AdminID: ID });
}

// ──────────────────────────────────────────────
//  RECONOCIMIENTO FACIAL
// ──────────────────────────────────────────────

/**
 * POST /api/guardarrostro
 * Guarda el descriptor facial de un cliente.
 * Body: { ID_Cliente, Rostro }
 */
async function GuardarRostro(req, res) {
    const { ID_Cliente, Rostro } = req.body;
    if (!ID_Cliente || !Rostro)
        return res.status(400).json({ Error: "Faltan datos" });

    const error = await dbRun(`UPDATE Cliente SET Rostro = ? WHERE Id = ?`, [JSON.stringify(Rostro), ID_Cliente]);
    if (error)
        return res.status(500).json({ Error: "Error en servidor" });

    return res.status(200).json({ Mensaje: "Rostro guardado" });
}

/**
 * POST /api/obtenerrostro
 * Obtiene el descriptor facial de un cliente por su nombre.
 * Body: { Nombre }
 */
async function ObtenerRostro(req, res) {
    const { Nombre } = req.body;
    if (!Nombre)
        return res.status(400).json({ Error: "Falta nombre" });

    const cliente = await dbGet(`SELECT Id, Nombre, Rostro FROM Cliente WHERE Nombre = ?`, [Nombre]);
    if (!cliente || !cliente.Rostro)
        return res.status(404).json({ Error: "Rostro no encontrado" });

    return res.status(200).json({
        Id: cliente.Id,
        Nombre: cliente.Nombre,
        Rostro: JSON.parse(cliente.Rostro)
    });
}

// ──────────────────────────────────────────────
//  UTILIDADES
// ──────────────────────────────────────────────

/**
 * POST /api/enviarcorreo
 * Envía un correo electrónico.
 * Body: { Destinatario, Asunto, Cuerpo }
 */
async function EnviarCorreo(req, res) {
    const { Destinatario, Asunto, Cuerpo } = req.body;
    const info = await enviarCorreo(Destinatario, Asunto, Cuerpo);

    if (!info.success)
        return res.status(500).json({ Mensaje: "Error al enviar correo.", success: false });

    return res.status(200).json({ Mensaje: "Correo enviado", success: true });
}

/**
 * POST /api/crearusuariosiniciales
 * Crea o verifica los usuarios por defecto (superadmin, admin).
 * Solo para uso en desarrollo.
 */
async function CrearUsuariosIniciales(req, res)
{
    try {
        const { crearUsuariosIniciales } = require('../Utils/initUsers');
        await crearUsuariosIniciales();
        return res.status(200).json({ Mensaje: "Usuarios iniciales creados/verificados" });
    } catch (error) {
        return res.status(500).json({ Error: "Error al crear usuarios", Detalle: error.message });
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
    CrearUsuariosIniciales,
    GuardarRostro,
    ObtenerRostro,
    ObtenerEmailCliente,
    CambiarContraseña
};