/**
 * Utilidades de Base de Datos
 * 
 * Wrappers con Promesas para los métodos de sqlite3.
 * Simplifican el uso de la base de datos evitando callbacks anidados.
 */

const db = require("../DataBase/db")

/**
 * Obtiene un solo registro de la base de datos.
 * @param {string} query - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Object|undefined>} El primer resultado o undefined
 */
function dbGet(query, params)
{
    return new Promise((resolve, reject) => {
        db.get(query, params, (Error, Datos) => {
            if(Error)
            {
                console.error("Error en Query", Error);
                reject(Error);
            }
            else
                resolve(Datos);
        });
    });
}

/**
 * Obtiene todos los registros que coinciden con la consulta.
 * @param {string} query - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Array>} Array de resultados
 */
function dbAll(query, params)
{
    return new Promise((resolve, reject) => {
        params = params || [];
        db.all(query, params, (Error, Datos) => {
            if(Error)
            {
                console.error("Error en Query", Error);
                reject(Error)
            }
            else
                resolve(Datos);
        });
    })
}

/**
 * Ejecuta una consulta que modifica la base de datos (INSERT, UPDATE, DELETE).
 * @param {string} query - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<false>} Retorna false si se ejecutó correctamente
 */
function dbRun(query, params)
{
    return new Promise((resolve, reject) => {
        db.run(query, params, (Error) => {
            if(Error)
            {
                console.error("Error en Query", Error);
                reject(Error);
            }
            else
                resolve(false);
        });
    })
}

module.exports = {dbGet, dbAll, dbRun};