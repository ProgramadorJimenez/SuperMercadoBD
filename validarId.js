const { error } = require('../views/respuesta');
const { esEnteroPositivo } = require('../utils/validaciones');

function validarId(req, res, next) {
  if (!esEnteroPositivo(req.params.id)) {
    return error(res, 'El id debe ser un número entero positivo', 400);
  }

  next();
}

module.exports = validarId;
