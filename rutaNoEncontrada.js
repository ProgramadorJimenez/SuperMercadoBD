const { error } = require('../views/respuesta');

function rutaNoEncontrada(req, res) {
  return error(res, `La ruta ${req.method} ${req.originalUrl} no existe`, 404);
}

module.exports = rutaNoEncontrada;
