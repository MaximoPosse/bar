const db = require("../DataBase/db")

function dbGet(query, params)
{
    return new Promise((resolve, reject) => {
        db.get(query, params, (Error, Datos) => {
            if(Error)
            {
                console.error("✖ Error en Query", err);
                reject(Error);
            }
            else
                resolve(Datos);
        });
    });
}

function dbAll(query, params)
{
    return new Promise((resolve, reject) => {
        params = params || [];
        db.all(query, params, (Error, Datos) => {
            if(Error)
            {
                console.error("✖ Error en Query", Error);
                reject(Error)
            }
            else
                resolve(Datos);
        });
    })
}

function dbRun(query, params)
{
    return new Promise((resolve, reject) => {
        db.run(query, params, (Error) => {
            if(Error)
            {
                console.error("✖ Error en Query", Error);
                reject(Error);
            }
            else
                resolve(false);
        });
    })
}

module.exports = {dbGet, dbAll, dbRun};