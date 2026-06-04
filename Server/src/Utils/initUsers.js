const db = require('../DataBase/db');
const bcrypt = require('bcrypt');

function dbGet(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params || [], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function dbRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params || [], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function crearUsuariosIniciales() {
    const saltRounds = 10;
    
    try {
        // Verificar si superadmin existe
        const superAdmin = await dbGet(`SELECT * FROM Empleado WHERE Nombre = ?`, ['superadmin']);
        
        if (!superAdmin) {
            // Crear SUPERADMIN
            const superAdminPassword = await bcrypt.hash('superadmin123', saltRounds);
            await dbRun(`
                INSERT INTO Empleado (Nombre, Correo, Contraseña, Rol)
                VALUES (?, ?, ?, ?)
            `, ['superadmin', 'superadmin@barplayero.com', superAdminPassword, 'SUPERADMIN']);
            console.log('✅ Usuario SUPERADMIN creado (usuario: superadmin, contraseña: superadmin123)');
        } else {
            console.log('ℹ️  Usuario superadmin ya existe');
        }
        
        // Verificar si admin existe
        const admin = await dbGet(`SELECT * FROM Empleado WHERE Nombre = ?`, ['admin']);
        
        if (!admin) {
            // Crear Admin
            const adminPassword = await bcrypt.hash('admin123', saltRounds);
            await dbRun(`
                INSERT INTO Empleado (Nombre, Correo, Contraseña, Rol)
                VALUES (?, ?, ?, ?)
            `, ['admin', 'admin@barplayero.com', adminPassword, 'Admin']);
            console.log('✅ Usuario Admin creado (usuario: admin, contraseña: admin123)');
        } else {
            console.log('ℹ️  Usuario admin ya existe');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error al crear usuarios iniciales:', error);
        throw error;
    }
}

module.exports = { crearUsuariosIniciales };
