const ErrorApi = require('../utils/ErrorApi');
const { error } = require('../views/respuesta');

function detalleErrores(err) {
  return err.errors.map((e) => ({ campo: e.path, mensaje: e.message }));
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  if (err instanceof ErrorApi) {
    return error(res, err.message, err.estado, err.errores);
  }

  if (err.type === 'entity.parse.failed') {
    return error(res, 'El cuerpo de la petición no es un JSON válido', 400);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return error(res, 'Ya existe un registro con esos datos', 409, detalleErrores(err));
  }

  if (err.name === 'SequelizeValidationError') {
    return error(res, 'Los datos enviados no son válidos', 400, detalleErrores(err));
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, 'La operación no es posible porque el registro está relacionado con otros datos', 409);
  }

  if (err.name === 'SequelizeDatabaseError') {
    return error(res, 'Uno o más datos tienen un formato incorrecto', 400);
  }

  console.error(err);
  return error(res, 'Error interno del servidor', 500);
}

module.exports = manejadorErrores;
