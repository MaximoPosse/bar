// Script para crear usuarios iniciales manualmente
const { crearUsuariosIniciales } = require('./src/Utils/initUsers');

async function main() {
    console.log('Iniciando creación de usuarios...');
    try {
        await crearUsuariosIniciales();
        console.log('✅ Usuarios creados exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear usuarios:', error);
        process.exit(1);
    }
}

main();

