// Invocar a la dependencias de encriptamiento
const Encriptar = require("bcrypt")
// --> Metodo de Seguridad
const Salto = 10;

// ---> Metodo para Registrar Contraseña Encriptada
async function EncriptarPassword(Password)
{
    const Seguridad = await Encriptar.genSalt(Salto);
    return await Encriptar.hash(Password, Seguridad);
}

// ---> Metodo para Desencriptar
async function CompararPassword(Password, Parametro)
{
    return await Encriptar.compare(Password, Parametro);
}

module.exports = {CompararPassword, EncriptarPassword}