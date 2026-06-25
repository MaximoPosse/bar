/**
 * Utilidades de Encriptación
 * 
 * Wrapper para bcrypt con funciones de hash y comparación de contraseñas.
 */

const bcrypt = require("bcrypt")

const SALT_ROUNDS = 10;

/**
 * Encripta una contraseña con bcrypt.
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
async function EncriptarPassword(password)
{
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
}

/**
 * Compara una contraseña en texto plano con su hash.
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en la base de datos
 * @returns {Promise<boolean>} true si coinciden
 */
async function CompararPassword(password, hash)
{
    return await bcrypt.compare(password, hash);
}

module.exports = {CompararPassword, EncriptarPassword}