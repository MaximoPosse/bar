/**
 * Inicialización de Usuarios por Defecto
 * 
 * Crea los usuarios predefinidos (superadmin, admin) al iniciar el sistema
 * si es que aún no existen en la base de datos.
 */

const { dbGet, dbRun } = require('./Querys');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Crea los usuarios iniciales (superadmin y admin) si no existen.
 * Se ejecuta automáticamente al iniciar el servidor.
 * 
 * Usuarios creados:
 *   - superadmin / superadmin123 (acceso total al sistema)
 *   - admin / admin123 (acceso administrativo estándar)
 * 
 * @returns {Promise<{success: boolean}>}
 */
async function crearUsuariosIniciales() {
    try {
        const superAdmin = await dbGet('SELECT * FROM Empleado WHERE Nombre = ?', ['superadmin']);

        if (!superAdmin) {
            const hash = await bcrypt.hash('superadmin123', SALT_ROUNDS);
            await dbRun(
                'INSERT INTO Empleado (Nombre, Correo, Contraseña, Rol) VALUES (?, ?, ?, ?)',
                ['superadmin', 'superadmin@barplayero.com', hash, 'SUPERADMIN']
            );
            console.log('Usuario SUPERADMIN creado (usuario: superadmin, contraseña: superadmin123)');
        } else {
            console.log('Usuario superadmin ya existe');
        }

        const admin = await dbGet('SELECT * FROM Empleado WHERE Nombre = ?', ['admin']);

        if (!admin) {
            const hash = await bcrypt.hash('admin123', SALT_ROUNDS);
            await dbRun(
                'INSERT INTO Empleado (Nombre, Correo, Contraseña, Rol) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@barplayero.com', hash, 'Admin']
            );
            console.log('Usuario Admin creado (usuario: admin, contraseña: admin123)');
        } else {
            console.log('Usuario admin ya existe');
        }

        return { success: true };
    } catch (error) {
        console.error('Error al crear usuarios iniciales:', error);
        throw error;
    }
}

module.exports = { crearUsuariosIniciales };
