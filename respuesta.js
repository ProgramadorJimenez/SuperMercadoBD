// Capa de vista: todas las respuestas de la API salen con el mismo formato JSON

function exito(res, datos, mensaje = 'Operación realizada correctamente', estado = 200) {
  const cuerpo = { ok: true, mensaje };

  if (Array.isArray(datos)) {
    cuerpo.total = datos.length;
  }

  cuerpo.datos = datos;
  return res.status(estado).json(cuerpo);
}

function error(res, mensaje, estado = 400, errores = null) {
  const cuerpo = { ok: false, mensaje };

  if (errores) {
    cuerpo.errores = errores;
  }

  return res.status(estado).json(cuerpo);
}

module.exports = { exito, error };
