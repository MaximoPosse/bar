/**
 * Rutas de Autenticación y Usuarios
 * 
 * Endpoints para registro, inicio de sesión (clientes y admins),
 * gestión de administradores, reconocimiento facial y recuperación
 * de contraseña.
 */

const Express = require("express");
const Rutas = Express.Router();

const {
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
} = require("../Controller/Login.Controller");

// --- Clientes ---
Rutas.post("/registrarse", Registrarse);                    // Registrar nuevo cliente
Rutas.post("/login", Login);                                // Inicio de sesión cliente

// --- Administradores ---
Rutas.post("/registrarseadmin", RegistrarseAdmin);          // Registrar nuevo empleado/admin
Rutas.post("/loginadmin", LoginAdmin);                      // Inicio de sesión admin
Rutas.get("/obteneradmins", ObtenerAdmins);                  // Listar admins (solo SUPERADMIN)
Rutas.post("/eliminaradmin", EliminarAdmin);                // Eliminar admin (solo SUPERADMIN)

// --- Reconocimiento Facial ---
Rutas.post("/guardarrostro", GuardarRostro);                // Guardar descriptor facial
Rutas.post("/obtenerrostro", ObtenerRostro);                // Obtener descriptor facial

// --- Utilidades ---
Rutas.post("/enviarcorreo", EnviarCorreo);                  // Enviar correo electrónico
Rutas.post("/crearusuariosiniciales", CrearUsuariosIniciales); // Crear usuarios por defecto
Rutas.get("/obteneremailcliente/:Nombre", ObtenerEmailCliente); // Obtener email por username
Rutas.post("/cambiarcontraseña", CambiarContraseña);        // Cambiar contraseña

module.exports = Rutas;